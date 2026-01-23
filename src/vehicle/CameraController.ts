import { Camera, Vector3, Quaternion, Euler } from 'three';

export class CameraController {
    private camera: Camera;
    private baseHeight: number = 4; // Height above vehicle

    // Free look state
    private freeLookActive: boolean = false;
    private freeLookYaw: number = 0;
    private freeLookPitch: number = 0;

    constructor(camera: Camera) {
        this.camera = camera;
    }

    setFreeLook(active: boolean, yaw: number, pitch: number) {
        // No longer trigger return animation - camera persists its angle
        this.freeLookActive = active;

        // Always sync with store values (Store is source of truth for persistence vs reset)
        this.freeLookYaw = yaw;
        this.freeLookPitch = pitch;

        // When deactivated, keep the current yaw/pitch values for persistent camera angle
        // (If store sends 0, it will reset. If store sends value, it persists)
    }

    updateFreeLookAngles(yaw: number, pitch: number) {
        if (this.freeLookActive) {
            this.freeLookYaw = yaw;
            this.freeLookPitch = pitch;
        }
    }

    update(targetPosition: Vector3, targetRotation: Quaternion, delta: number, cameraDistance: number = 8) {
        // Calculate dynamic offset based on camera distance
        const offset = new Vector3(0, this.baseHeight, cameraDistance);

        // Always apply the current yaw/pitch rotation (persists after releasing right-click)
        // Create rotation from yaw and pitch
        const freeLookRotation = new Quaternion();
        const euler = new Euler(this.freeLookPitch, this.freeLookYaw, 0, 'YXZ');
        freeLookRotation.setFromEuler(euler);

        // Apply free look on top of vehicle rotation
        const combinedRotation = targetRotation.clone().multiply(freeLookRotation);

        // Calculate camera position with the combined rotation
        const desiredPos = offset.clone().applyQuaternion(combinedRotation).add(targetPosition);

        // Look at the vehicle (slightly above center)
        const lookTarget = targetPosition.clone().add(new Vector3(0, 1, 0));

        // Smoothly lerp towards desired position for weightiness
        const damping = 5.0 * delta;
        this.camera.position.lerp(desiredPos, damping);

        // Look at target
        this.camera.lookAt(lookTarget);
    }
}
