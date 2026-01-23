import { Vector3, Quaternion, Raycaster, Object3D } from 'three';
import type { InputState } from './VehicleController';
import { clamp } from 'three/src/math/MathUtils.js';

export class VehiclePhysics {
    public position: Vector3 = new Vector3(0, 5, 0); // Start slightly above ground
    public rotation: Quaternion = new Quaternion();
    public velocity: Vector3 = new Vector3();
    public angularVelocity: Vector3 = new Vector3(); // Using Vector3 for general angular velocity

    // Simple Arcade Physics Ops
    private speed: number = 0;
    private maxSpeed: number = 60; // m/s
    private acceleration: number = 20; // m/s^2
    private braking: number = 30; // m/s^2
    // private drag: number = 0.5; // Air resistance (Unused)
    private friction: number = 0.95; // Ground friction
    private turnSpeed: number = 2.0;

    private raycaster: Raycaster = new Raycaster();
    private groundHeight: number = 0;
    private onGround: boolean = false;

    // Helpers
    private forward: Vector3 = new Vector3();
    private up: Vector3 = new Vector3(0, 1, 0);
    private dummyVec: Vector3 = new Vector3();

    constructor() {
        this.raycaster.far = 10; // Check ground within 10m
    }

    update(delta: number, input: InputState, terrainObjects: Object3D[]) {
        // 1. Ground Detection
        this.checkGround(terrainObjects);

        // 2. Input Processing
        // Throttle
        let throttle = 0;
        if (input.forward) throttle += 1;
        if (input.backward) throttle -= 1;

        // Apply Acceleration
        if (throttle !== 0) {
            this.speed += throttle * this.acceleration * delta;
        } else {
            // Coasting friction
            this.speed *= Math.pow(this.friction, delta * 60);
        }

        // Braking
        if (input.brake) {
            if (this.speed > 0) this.speed -= this.braking * delta;
            else if (this.speed < 0) this.speed += this.braking * delta;

            // Stop completely if slow enough
            if (Math.abs(this.speed) < 1) this.speed = 0;
        }

        // Limit Max Speed
        this.speed = clamp(this.speed, -this.maxSpeed / 3, this.maxSpeed);

        // Steering
        if (Math.abs(this.speed) > 1) {
            let steer = 0;
            if (input.left) steer += 1;
            if (input.right) steer -= 1;

            // Reverse steering if going backward
            const dir = Math.sign(this.speed);

            const rotationAmount = steer * this.turnSpeed * delta * dir;

            // Rotate around Y axis
            const rotQuat = new Quaternion().setFromAxisAngle(this.up, rotationAmount);
            this.rotation.multiply(rotQuat);
        }

        // 3. Update Position
        // Get forward vector from rotation
        this.forward.set(0, 0, -1).applyQuaternion(this.rotation);

        // Velocity is forward * speed
        // Ideally velocity would be separate and we'd apply forces, but for arcade, direct speed tracking is stable.
        this.velocity.copy(this.forward).multiplyScalar(this.speed);

        // Gravity
        if (!this.onGround) {
            this.velocity.y -= 9.8 * delta;
        } else {
            // Stick to ground with slight interpolation/smoothing could be done, but simple clamp for now
            // If we were falling, stop
            if (this.velocity.y < 0) this.velocity.y = 0;

            // Match height
            // Simple suspension: strictly snap to height + offset
            const targetY = this.groundHeight + 0.5; // Axle height
            // Smooth snap
            this.position.y += (targetY - this.position.y) * 10 * delta;
        }

        // Apply velocity p += v * dt
        this.dummyVec.copy(this.velocity).multiplyScalar(delta);
        this.position.add(this.dummyVec);

        // Prevent falling through map fallback
        if (this.position.y < -50) {
            this.position.set(0, 20, 0);
            this.speed = 0;
            this.velocity.set(0, 0, 0);
            this.rotation.identity();
        }
    }

    private checkGround(terrainObjects: Object3D[]) {
        // Raycast down from slightly above vehicle center
        // Origin: position + up * 1
        const rayOrigin = this.position.clone().add(new Vector3(0, 1.0, 0));
        const rayDir = new Vector3(0, -1, 0);

        this.raycaster.set(rayOrigin, rayDir);
        const intersects = this.raycaster.intersectObjects(terrainObjects, true); // Recursive check

        if (intersects.length > 0) {
            this.groundHeight = intersects[0].point.y;

            // If we are close to ground, we are "on ground"
            if (this.position.y <= this.groundHeight + 1.5) { // Increased tolerance slightly
                this.onGround = true;

                // Align to ground normal
                if (intersects[0].face) {
                    // Use world normal from intersection (interpolated) or default up
                    const groundNormal = intersects[0].normal || new Vector3(0, 1, 0);

                    // Smoothly align 'up' to groundNormal
                    // We blend the tilt to the current rotation to preserve yaw
                    const currentUp = new Vector3(0, 1, 0).applyQuaternion(this.rotation);
                    const tiltQuat = new Quaternion().setFromUnitVectors(currentUp, groundNormal);

                    // Apply tilt
                    this.rotation.premultiply(tiltQuat);
                }
            } else {
                this.onGround = false;
            }
        } else {
            this.onGround = false;
            this.groundHeight = -100; // Deep fell
        }
    }
}
