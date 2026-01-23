import { Vector3, Quaternion, Raycaster, Object3D } from 'three';
import type { InputState } from './VehicleController';
import { clamp } from 'three/src/math/MathUtils.js';

export class VehiclePhysics {
    public position: Vector3 = new Vector3(0, 5, 0);
    public rotation: Quaternion = new Quaternion();
    public velocity: Vector3 = new Vector3();
    public angularVelocity: Vector3 = new Vector3();

    // Physics parameters
    private speed: number = 0;
    private maxSpeed: number = 60; // m/s
    private acceleration: number = 20; // m/s^2
    private braking: number = 30; // m/s^2
    private friction: number = 0.95; // Ground friction
    private turnSpeed: number = 2.0;

    private raycaster: Raycaster = new Raycaster();

    // Ground detection state
    private groundHeight: number = 0;
    private onGround: boolean = false;
    private isOnRoad: boolean = false;

    // 4-wheel raycasting offsets (matching VehicleModel dimensions)
    private wheelOffsets: Vector3[] = [
        new Vector3(-1.1, 0, -1.5), // Front Left
        new Vector3(1.1, 0, -1.5),  // Front Right
        new Vector3(-1.1, 0, 1.5),  // Rear Left
        new Vector3(1.1, 0, 1.5)    // Rear Right
    ];

    private wheelHeights: number[] = [0, 0, 0, 0];
    private wheelOnGround: boolean[] = [false, false, false, false];

    // Helpers
    private forward: Vector3 = new Vector3();
    private up: Vector3 = new Vector3(0, 1, 0);
    private dummyVec: Vector3 = new Vector3();

    constructor() {
        this.raycaster.far = 15; // Extended range for slopes
    }

    update(delta: number, input: InputState, terrainObjects: Object3D[]) {
        // 1. Ground Detection (4 wheels)
        this.checkGroundFourWheels(terrainObjects);

        // 2. Input Processing
        let throttle = 0;
        if (input.forward) throttle += 1;
        if (input.backward) throttle -= 0.5; // Slower reverse

        // Surface-based friction and speed multiplier
        let currentFriction = this.friction;
        let speedMultiplier = 1.0;

        if (this.onGround) {
            if (!this.isOnRoad) {
                // Off-road penalty
                currentFriction *= 0.9;
                speedMultiplier = 0.5; // Max 50% speed off-road
            }
        }

        // Apply Acceleration
        if (throttle !== 0) {
            const acc = throttle > 0 ? this.acceleration : this.acceleration * 0.5;
            this.speed += throttle * acc * delta;
        } else {
            // Coasting friction
            this.speed *= Math.pow(currentFriction, delta * 60);
        }

        // Braking
        if (input.brake) {
            const brakePower = this.braking * delta;
            if (this.speed > 0) this.speed = Math.max(0, this.speed - brakePower);
            else if (this.speed < 0) this.speed = Math.min(0, this.speed + brakePower);
        }

        // Limit Max Speed (apply off-road penalty)
        const maxS = this.isOnRoad ? this.maxSpeed : this.maxSpeed * speedMultiplier;
        this.speed = clamp(this.speed, -this.maxSpeed / 3, maxS);

        // Steering
        if (Math.abs(this.speed) > 1) {
            let steer = 0;
            if (input.left) steer += 1;
            if (input.right) steer -= 1;

            const dir = Math.sign(this.speed);

            // Dynamic turn speed based on velocity
            const turnStrength = this.turnSpeed * (1.0 - Math.abs(this.speed) / (this.maxSpeed * 1.5));
            const rotationAmount = steer * turnStrength * delta * dir;

            const rotQuat = new Quaternion().setFromAxisAngle(this.up, rotationAmount);
            this.rotation.multiply(rotQuat);
        }

        // 3. Update Position/Velocity
        this.forward.set(0, 0, -1).applyQuaternion(this.rotation);
        this.velocity.copy(this.forward).multiplyScalar(this.speed);

        // Gravity & Ground Snap
        if (!this.onGround) {
            this.velocity.y -= 15 * delta; // Slightly stronger gravity
        } else {
            if (this.velocity.y < 0) this.velocity.y = 0;

            // Simple suspension snap to avg ground height
            const targetY = this.groundHeight + 0.5;
            this.position.y += (targetY - this.position.y) * 15 * delta;
        }

        // Apply velocity
        this.dummyVec.copy(this.velocity).multiplyScalar(delta);
        this.position.add(this.dummyVec);

        // Prevent falling through map
        if (this.position.y < -50) {
            this.position.set(0, 20, 0);
            this.speed = 0;
            this.velocity.set(0, 0, 0);
            this.rotation.identity();
        }
    }

    private checkGroundFourWheels(terrainObjects: Object3D[]) {
        let totalHeight = 0;
        let wheelsContact = 0;
        let roadHits = 0;
        const groundNormals: Vector3[] = [];

        for (let i = 0; i < 4; i++) {
            const offset = this.wheelOffsets[i].clone().applyQuaternion(this.rotation);
            const rayOrigin = this.position.clone().add(offset).add(new Vector3(0, 5, 0));
            const rayDir = new Vector3(0, -1, 0);

            this.raycaster.set(rayOrigin, rayDir);
            const intersects = this.raycaster.intersectObjects(terrainObjects, true);

            if (intersects.length > 0) {
                const hit = intersects[0];
                this.wheelHeights[i] = hit.point.y;
                this.wheelOnGround[i] = (this.position.y + offset.y <= hit.point.y + 1.5);

                totalHeight += hit.point.y;
                wheelsContact++;

                if (hit.normal) groundNormals.push(hit.normal.clone());

                // Check if hit object is a road (using userData.isRoad flag)
                let isRoad = false;
                let curr: Object3D | null = hit.object;
                while (curr) {
                    if (curr.userData?.isRoad) {
                        isRoad = true;
                        break;
                    }
                    curr = curr.parent;
                }
                if (isRoad) roadHits++;
            } else {
                this.wheelOnGround[i] = false;
            }
        }

        if (wheelsContact > 0) {
            this.groundHeight = totalHeight / wheelsContact;
            this.onGround = wheelsContact >= 2; // At least 2 wheels on ground for stability
            this.isOnRoad = roadHits > 0;

            // Align to ground normal
            if (groundNormals.length > 0) {
                const avgNormal = new Vector3(0, 0, 0);
                groundNormals.forEach(n => avgNormal.add(n));
                avgNormal.divideScalar(groundNormals.length).normalize();

                const currentUp = new Vector3(0, 1, 0).applyQuaternion(this.rotation);
                const tiltQuat = new Quaternion().setFromUnitVectors(currentUp, avgNormal);

                // Damp the tilt for smoothness
                const identity = new Quaternion();
                tiltQuat.slerp(identity, 0.9); // Only apply a portion each frame
                this.rotation.premultiply(tiltQuat);
            }
        } else {
            this.onGround = false;
            this.isOnRoad = false;
        }
    }
}
