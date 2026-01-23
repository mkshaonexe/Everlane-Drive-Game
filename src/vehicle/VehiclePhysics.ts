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
    private turnSpeed: number = 2.0;

    // Suspension Parameters
    private suspensionRestLength: number = 0.6; // Ideal spring length
    private suspensionStiffness: number = 40.0; // Spring constant
    private suspensionDamping: number = 2.5;    // Damper

    private raycaster: Raycaster = new Raycaster();
    private rayOrigin: Vector3 = new Vector3();
    private rayDir: Vector3 = new Vector3(0, -1, 0);

    // Ground detection state
    private onGround: boolean = false;
    private isOnRoad: boolean = false;

    // 4-wheel raycasting offsets (matching VehicleModel dimensions)
    private wheelOffsets: Vector3[] = [
        new Vector3(-1.1, 0, -1.5), // Front Left
        new Vector3(1.1, 0, -1.5),  // Front Right
        new Vector3(-1.1, 0, 1.5),  // Rear Left
        new Vector3(1.1, 0, 1.5)    // Rear Right
    ];

    // Helpers
    private forward: Vector3 = new Vector3();
    private up: Vector3 = new Vector3(0, 1, 0);
    private dummyVec: Vector3 = new Vector3();

    constructor() {
        this.raycaster.far = 2.0; // Shorter ray for suspension
    }

    update(delta: number, input: InputState, terrainObjects: Object3D[]) {
        // --- 1. Suspension & Gravity ---
        let wheelsOnGround = 0;
        let roadHits = 0;
        const totalForce = new Vector3(0, 0, 0);

        // Apply Gravity
        this.velocity.y -= 25 * delta;

        // Reset grounded state for this frame check
        let isCurrentlyGrounded = false;

        for (let i = 0; i < 4; i++) {
            // Calculate wheel position in world space
            const wheelOffset = this.wheelOffsets[i].clone().applyQuaternion(this.rotation);
            this.rayOrigin.copy(this.position).add(wheelOffset).add(new Vector3(0, 0.5, 0)); // Start ray slightly up

            // Raycast down
            this.raycaster.set(this.rayOrigin, this.rayDir);
            const intersects = this.raycaster.intersectObjects(terrainObjects, true);

            if (intersects.length > 0) {
                const hit = intersects[0];
                const distance = hit.distance;

                // Suspension Compression
                // Ray starts +0.5 up. So actual extension is distance - 0.5? 
                // Let's treat valid suspension range as [0, suspensionRestLength + margin]
                // If hit dist < 0.5 + RestLength, we have contact

                const compression = (this.suspensionRestLength + 0.5) - distance;

                if (compression > 0) {
                    wheelsOnGround++;
                    isCurrentlyGrounded = true;

                    // Spring Force: F = k * x
                    const springForce = this.suspensionStiffness * compression;

                    // Damping: F = -d * v (vertical velocity)
                    // We need local vertical velocity at this wheel
                    // V_wheel = V_car + Omega x R
                    // Only care about Y component for simple model
                    const wheelVelY = this.velocity.y; // Approximation
                    const damperForce = -this.suspensionDamping * wheelVelY;

                    const suspensionForceY = Math.max(0, springForce + damperForce);

                    // Add Upward Force
                    // Distribute force: simply adding to Y velocity for now (impulse-like)
                    // Or accumulate force to apply to acceleration
                    totalForce.y += suspensionForceY;

                    // Detect Road
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
                }
            }
        }

        // Apply Suspension Forces
        // Average the force or apply it? 
        // With 4 wheels, we divide mass? Let's treat mass = 1 for simplicity of tweaking
        this.velocity.add(totalForce.multiplyScalar(delta));

        this.onGround = isCurrentlyGrounded;
        this.isOnRoad = roadHits > 0;


        // --- 2. Surface Physics & Input ---

        let currentFriction = this.onGround ? (this.isOnRoad ? 2.0 : 1.0) : 0.1; // Ground vs Air friction
        let speedMultiplier = 1.0;
        let turnMultiplier = 1.0;

        if (this.onGround && !this.isOnRoad) {
            // OFF-ROAD PENALTIES
            speedMultiplier = 0.60; // Max 60% speed
            currentFriction = 3.0;  // High rolling resistance (mud/grass)
            turnMultiplier = 0.75;  // Understeer
        }

        // Throttle
        let throttle = 0;
        if (input.forward) throttle += 1;
        if (input.backward) throttle -= 0.5;

        if (throttle !== 0 && this.onGround) {
            const acc = throttle > 0 ? this.acceleration : this.acceleration * 0.5;
            this.speed += throttle * acc * delta;
        } else {
            // Friction / Drag
            if (this.onGround) {
                // Apply strong rolling resistance if no throttle
                this.speed -= this.speed * currentFriction * delta;
            } else {
                // Air drag
                this.speed *= 0.995;
            }
        }

        // Braking
        if (input.brake && this.onGround) {
            const brakePower = this.braking * delta;
            if (this.speed > 0) this.speed = Math.max(0, this.speed - brakePower);
            else if (this.speed < 0) this.speed = Math.min(0, this.speed + brakePower);
        }

        // Speed Limits
        const maxS = this.maxSpeed * speedMultiplier;
        this.speed = clamp(this.speed, -maxS / 3, maxS);

        // Stop completely if very slow and no input
        if (Math.abs(this.speed) < 0.1 && throttle === 0 && this.onGround) {
            this.speed = 0;
        }

        // --- 3. Steering & Orientation ---

        // Simple turning logic (rotate the car body)
        // Ideally should apply torque, but direct rotation is more stable for arcade feel
        if (Math.abs(this.speed) > 1 && this.onGround) {
            let steer = 0;
            if (input.left) steer += 1;
            if (input.right) steer -= 1;

            const dir = Math.sign(this.speed);
            const turnStrength = this.turnSpeed * turnMultiplier * (1.0 - Math.abs(this.speed) / (this.maxSpeed * 2));
            const rotationAmount = steer * turnStrength * delta * dir;

            const rotQuat = new Quaternion().setFromAxisAngle(this.up, rotationAmount);
            this.rotation.multiply(rotQuat);
        }

        // --- 4. Integration ---

        // Convert Speed to Velocity Vector (Car Forward direction)
        this.forward.set(0, 0, -1).applyQuaternion(this.rotation);

        // Linear Velocity X/Z comes from engine speed + direction
        // Y velocity comes from gravity + suspension
        const horizontalVel = this.forward.clone().multiplyScalar(this.speed);

        // Blend physics velocity
        this.velocity.x = horizontalVel.x;
        this.velocity.z = horizontalVel.z;
        // Y is kept from suspension calculation

        // Move Position
        this.dummyVec.copy(this.velocity).multiplyScalar(delta);
        this.position.add(this.dummyVec);

        // ============================================
        // GROUND SAFETY NET - Prevent falling into void
        // ============================================

        // If no wheels are on ground and car is falling significantly
        if (!this.onGround && this.velocity.y < -5) {
            // Create virtual ground at estimated height (around 0-10m)
            // This prevents the car from falling forever when off-road
            const estimatedGround = 5; // Default ground level estimate

            if (this.position.y < estimatedGround - 5) {
                // Gently push car upward instead of teleporting
                this.velocity.y = Math.max(this.velocity.y, 3);

                // Slow down horizontal velocity when recovering
                this.velocity.x *= 0.98;
                this.velocity.z *= 0.98;
                this.speed *= 0.95;
            }
        }

        // Hard fail-safe: teleport back if fallen very deep
        if (this.position.y < -30) {
            // Find a safer respawn point (reset but keep some forward momentum)
            this.position.y = 10;
            this.velocity.y = 0;
            // Keep some momentum instead of full reset
            this.speed *= 0.5;
        }

        // Emergency full reset if fallen extremely deep (something went very wrong)
        if (this.position.y < -100) {
            this.position.set(0, 10, 0);
            this.velocity.set(0, 0, 0);
            this.speed = 0;
            this.rotation.identity();
        }

        // TODO: Add pitch/roll damping/restoring forces to keep car upright
        // For now, keep rotation strictly yaw-based to prevent flipping bugs unless on serious terrain
        if (this.onGround) {
            // Apply damping to align car with "up" vector (0, 1, 0) for stability
            // This acts like anti-roll bars and restores upright position
            const predictedUp = new Vector3(0, 1, 0).applyQuaternion(this.rotation);
            const targetUp = new Vector3(0, 1, 0);

            // Calculate rotation needed to align predictedUp with targetUp
            const correctionQuat = new Quaternion().setFromUnitVectors(predictedUp, targetUp);

            // Apply a fraction of this correction (slerp)
            const dampingFactor = 5.0 * delta; // Adjust strength
            const slerpedCorrection = new Quaternion().slerp(correctionQuat, Math.min(dampingFactor, 1.0));

            // Apply to current rotation
            this.rotation.premultiply(slerpedCorrection);
        }
    }
}
