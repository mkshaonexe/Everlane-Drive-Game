import { Camera, Vector3, Quaternion, Euler } from 'three';

export class CameraController {
    private camera: Camera;
    private offset: Vector3;

    // Free look state
    private freeLookActive: boolean = false;
    private freeLookYaw: number = 0;
    private freeLookPitch: number = 0;

    // Smooth return state
    private isReturning: boolean = false;
    private returnProgress: number = 0;
    private savedYaw: number = 0;
    private savedPitch: number = 0;
    private returnSpeed: number = 3.0; // How fast camera returns

    constructor(camera: Camera) {
        this.camera = camera;
        // Standard Chase Cam
        this.offset = new Vector3(0, 4, 8);
    }

    setFreeLook(active: boolean, yaw: number, pitch: number) {
        if (this.freeLookActive && !active) {
            // Starting return animation
            this.isReturning = true;
            this.returnProgress = 0;
            this.savedYaw = this.freeLookYaw;
            this.savedPitch = this.freeLookPitch;
        }

        this.freeLookActive = active;
        if (active) {
            this.freeLookYaw = yaw;
            this.freeLookPitch = pitch;
            this.isReturning = false;
        }
    }

    updateFreeLookAngles(yaw: number, pitch: number) {
        if (this.freeLookActive) {
            this.freeLookYaw = yaw;
            this.freeLookPitch = pitch;
        }
    }

    update(targetPosition: Vector3, targetRotation: Quaternion, delta: number) {
        // Handle return animation
        if (this.isReturning) {
            this.returnProgress += delta * this.returnSpeed;
            if (this.returnProgress >= 1) {
                this.isReturning = false;
                this.freeLookYaw = 0;
                this.freeLookPitch = 0;
            } else {
                // Smooth easing
                const t = 1 - Math.pow(1 - this.returnProgress, 3);
                this.freeLookYaw = this.savedYaw * (1 - t);
                this.freeLookPitch = this.savedPitch * (1 - t);
            }
        }

        // Calculate base desired position (standard chase cam)
        let desiredPos = this.offset.clone().applyQuaternion(targetRotation).add(targetPosition);
        let lookTarget = targetPosition.clone().add(new Vector3(0, 1, 0));

        // Apply free look rotation if active or returning
        if (this.freeLookActive || this.isReturning) {
            // Create rotation from yaw and pitch
            const freeLookRotation = new Quaternion();
            const euler = new Euler(this.freeLookPitch, this.freeLookYaw, 0, 'YXZ');
            freeLookRotation.setFromEuler(euler);

            // Apply free look on top of vehicle rotation
            const combinedRotation = targetRotation.clone().multiply(freeLookRotation);

            // Recalculate camera position with free look
            desiredPos = this.offset.clone().applyQuaternion(combinedRotation).add(targetPosition);

            // Calculate look direction
            const lookDirection = new Vector3(0, 0, -1).applyQuaternion(combinedRotation);
            lookTarget = this.camera.position.clone().add(lookDirection.multiplyScalar(10));
        }

        // Smoothly lerp towards desired position for weightiness
        // Damping factor
        const damping = 5.0 * delta;
        this.camera.position.lerp(desiredPos, damping);

        // Look at target
        this.camera.lookAt(lookTarget);
    }
}
