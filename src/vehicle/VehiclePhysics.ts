import { Vector3, Quaternion, Raycaster, Object3D } from 'three';
import type { InputState } from './VehicleController';
import { clamp } from 'three/src/math/MathUtils.js';

export class VehiclePhysics {
    public position: Vector3 = new Vector3(0, 5, 0);
    public rotation: Quaternion = new Quaternion();
    public velocity: Vector3 = new Vector3();
    public angularVelocity: Vector3 = new Vector3();

    // Physics parameters - REALISTIC DRIVING MODEL
    private speed: number = 0;

    // Speed limits (m/s) - 60 m/s = 216 km/h
    private normalMaxSpeed: number = 50;    // ~180 km/h for normal driving (game-like)
    private turboMaxSpeed: number = 60;     // ~216 km/h for turbo (W+Shift)
    private reverseMaxSpeed: number = 20;   // ~72 km/h reverse

    // Acceleration (m/s²) - game-balanced
    private normalAcceleration: number = 12;  // Normal W - faster for game feel
    private turboAcceleration: number = 25;   // W+Shift - fast (0-100 in ~1.1 seconds)
    private reverseAcceleration: number = 8;  // Reverse speed

    // Deceleration & Resistance
    private engineBraking: number = 3;        // m/s² when releasing throttle (gear resistance)
    private airDragCoefficient: number = 0.0015; // Quadratic air resistance
    private rollingResistance: number = 0.5;  // Constant rolling friction

    // Braking
    private brakeStrength: number = 40;       // m/s² for S key braking at high speed
    private handbrakeStrength: number = 60;   // m/s² for Space key emergency stop

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
    
    public lastTerrainObjects: Object3D[] = [];

    constructor() {
        this.raycaster.far = 2.0; // Shorter ray for suspension
    }

    update(delta: number, input: InputState, terrainObjects: Object3D[]) {
        this.lastTerrainObjects = terrainObjects;
        
        // --- Water Detection ---
        let waterY = -999;
        let isWater = false;

        const waterRayOrigin = this.position.clone().add(new Vector3(0, 10, 0));
        const waterRayDir = new Vector3(0, -1, 0);
        const waterRaycaster = new Raycaster(waterRayOrigin, waterRayDir, 0, 110);
        const waterIntersects = waterRaycaster.intersectObjects(terrainObjects, true);

        for (const hit of waterIntersects) {
            let isWaterMesh = false;
            const mat = (hit.object as any).material;
            if (mat) {
                if (Array.isArray(mat)) {
                    isWaterMesh = mat.some(m => m.name === 'material_047_0');
                } else {
                    isWaterMesh = mat.name === 'material_047_0';
                }
            }
            if (!isWaterMesh && hit.object.name && hit.object.name.includes('material_100_0')) {
                isWaterMesh = true;
            }
            if (isWaterMesh) {
                waterY = hit.point.y;
                isWater = true;
                break;
            }
        }

        // --- 1. Suspension & Gravity ---
        let wheelsOnGround = 0;
        let roadHits = 0;
        const totalForce = new Vector3(0, 0, 0);

        // Apply Gravity
        this.velocity.y -= 25 * delta;

        // Reset grounded state for this frame check
        let isCurrentlyGrounded = false;
        let maxPenetration = 0;

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

                // Check if this wheel hit is water
                let isWaterHit = false;
                const mat = (hit.object as any).material;
                if (mat) {
                    if (Array.isArray(mat)) {
                        isWaterHit = mat.some(m => m.name === 'material_047_0');
                    } else {
                        isWaterHit = mat.name === 'material_047_0';
                    }
                }
                if (!isWaterHit && hit.object.name && hit.object.name.includes('material_100_0')) {
                    isWaterHit = true;
                }

                // Only apply solid ground collision / suspension if it's not water
                if (!isWaterHit) {
                    // Solid ground collision (depenetration)
                    if (distance < 0.5) {
                        const penetration = 0.5 - distance;
                        if (penetration > maxPenetration) {
                            maxPenetration = penetration;
                        }
                    }

                    // Suspension Compression
                    const compression = (this.suspensionRestLength + 0.5) - distance;

                    if (compression > 0) {
                        wheelsOnGround++;
                        isCurrentlyGrounded = true;

                        // Spring Force: F = k * x
                        const springForce = this.suspensionStiffness * compression;

                        // Damping: F = -d * v (vertical velocity)
                        const wheelVelY = this.velocity.y; // Approximation
                        const damperForce = -this.suspensionDamping * wheelVelY;

                        const suspensionForceY = Math.max(0, springForce + damperForce);
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
        }

        // Apply Suspension Forces
        this.velocity.add(totalForce.multiplyScalar(delta));

        this.onGround = isCurrentlyGrounded;
        this.isOnRoad = roadHits > 0;

        // --- Water & Ground Depenetration Logic ---
        const inWater = isWater && (this.position.y <= waterY + 0.3);
        if (inWater) {
            const time = performance.now() * 0.003;
            const waveBob = Math.sin(time) * 0.08;
            this.position.y = waterY + 0.2 + waveBob;
            
            // Stop falling
            this.velocity.y = Math.max(0, this.velocity.y);
            
            // Make the car behave as if grounded on water
            this.onGround = true;
            this.isOnRoad = false;
        } else if (maxPenetration > 0) {
            // Apply solid ground depenetration if not in water
            this.position.y += maxPenetration;
            this.velocity.y = Math.max(0, this.velocity.y);
            this.onGround = true;
        }

        // --- 2. Surface Physics & Input ---

        let speedMultiplier = 1.0;
        let turnMultiplier = 1.0;

        if (inWater) {
            // WATER PENALTIES (driving in water is slow and heavy)
            speedMultiplier = 0.35; // Max 35% speed
            turnMultiplier = 0.60;  // High water resistance to turning
        } else if (this.onGround && !this.isOnRoad) {
            // OFF-ROAD PENALTIES
            speedMultiplier = 0.60; // Max 60% speed
            turnMultiplier = 0.75;  // Understeer
        }

        // ============================================
        // REALISTIC THROTTLE & ACCELERATION
        // ============================================

        // Determine max speed and acceleration based on boost (Shift) state
        const isTurbo = input.boost && input.forward;
        const currentMaxSpeed = isTurbo ? this.turboMaxSpeed : this.normalMaxSpeed;
        const currentAcceleration = isTurbo ? this.turboAcceleration : this.normalAcceleration;

        if (input.forward && this.onGround) {
            // FORWARD ACCELERATION (W or W+Shift)
            let effectiveAcc: number;

            if (isTurbo) {
                // Turbo mode: Full power all the way
                effectiveAcc = currentAcceleration;
            } else {
                // Normal mode: Progressive speed zones (like gear shifts)
                const speedKmh = Math.abs(this.speed) * 3.6; // Convert m/s to km/h

                if (speedKmh < 80) {
                    // 0-80 km/h: Fast acceleration (100% power)
                    effectiveAcc = currentAcceleration;
                } else if (speedKmh < 150) {
                    // 80-150 km/h: Medium acceleration (50% power)
                    effectiveAcc = currentAcceleration * 0.5;
                } else {
                    // 150-180 km/h: Slow acceleration (25% power)
                    effectiveAcc = currentAcceleration * 0.25;
                }
            }

            this.speed += effectiveAcc * delta;

        } else if (input.backward && this.onGround) {
            // S KEY: BRAKE or REVERSE
            if (this.speed > 1) {
                // HIGH SPEED: Apply strong braking force to slow down quickly
                const brakeForce = this.brakeStrength * delta;
                this.speed = Math.max(0, this.speed - brakeForce);
            } else if (this.speed > -this.reverseMaxSpeed) {
                // LOW/STOPPED: Transition to reverse
                this.speed -= this.reverseAcceleration * delta;
            }

        } else if (!input.forward && !input.backward && this.onGround) {
            // NO THROTTLE: Realistic deceleration (coasting)
            // Apply engine braking (gear resistance)
            const engineBrakeForce = this.engineBraking * delta;

            // Apply air drag (quadratic - stronger at high speeds)
            const airDragForce = this.airDragCoefficient * this.speed * Math.abs(this.speed) * delta;

            // Apply rolling resistance (constant)
            const rollingForce = this.rollingResistance * delta * Math.sign(this.speed);

            // Total deceleration
            if (this.speed > 0) {
                this.speed -= engineBrakeForce + airDragForce + Math.abs(rollingForce);
                this.speed = Math.max(0, this.speed);
            } else if (this.speed < 0) {
                this.speed += engineBrakeForce + Math.abs(airDragForce) + Math.abs(rollingForce);
                this.speed = Math.min(0, this.speed);
            }
        }

        // Air resistance when not on ground
        if (!this.onGround) {
            this.speed *= 0.998;
        }

        // ============================================
        // HANDBRAKE (Space) - Emergency stop
        // ============================================
        if (input.brake && this.onGround) {
            const handbrakeForce = this.handbrakeStrength * delta;
            if (this.speed > 0) {
                this.speed = Math.max(0, this.speed - handbrakeForce);
            } else if (this.speed < 0) {
                this.speed = Math.min(0, this.speed + handbrakeForce);
            }
        }

        // ============================================
        // SPEED LIMITS
        // ============================================
        const maxS = currentMaxSpeed * speedMultiplier;
        const minS = -this.reverseMaxSpeed * speedMultiplier;
        this.speed = clamp(this.speed, minS, maxS);

        // Stop completely if very slow and no input
        if (Math.abs(this.speed) < 0.5 && !input.forward && !input.backward && this.onGround) {
            this.speed *= 0.9; // Gradual stop
            if (Math.abs(this.speed) < 0.1) {
                this.speed = 0;
            }
        }

        // --- 3. Steering & Orientation ---

        // Simple turning logic (rotate the car body)
        // Ideally should apply torque, but direct rotation is more stable for arcade feel
        if (Math.abs(this.speed) > 1 && this.onGround) {
            let steer = 0;
            if (input.left) steer += 1;
            if (input.right) steer -= 1;

            const dir = Math.sign(this.speed);
            const turnStrength = this.turnSpeed * turnMultiplier * (1.0 - Math.abs(this.speed) / (this.turboMaxSpeed * 2));
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
