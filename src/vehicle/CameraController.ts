import { Camera, Vector3, Quaternion } from 'three';

export class CameraController {
    private camera: Camera;
    private offset: Vector3;

    constructor(camera: Camera) {
        this.camera = camera;
        // Standard Chase Cam
        this.offset = new Vector3(0, 4, 8);
    }

    update(targetPosition: Vector3, targetRotation: Quaternion, delta: number) {
        // Calculate desired position
        // Transform offset by vehicle rotation to be behind it
        const desiredPos = this.offset.clone().applyQuaternion(targetRotation).add(targetPosition);

        // Smoothly lerp towards desired position for weightiness
        // Damping factor
        const damping = 5.0 * delta;
        this.camera.position.lerp(desiredPos, damping);

        // Calculate look target (Unused for now, keeping concept)
        // const targetLookAt = targetPosition.clone().add(this.lookAtOffset.clone().applyQuaternion(targetRotation));

        // Smoothly update lookAt if needed, or just lookAt directly (usually stiffer is better for LookAt)
        // For now, direct lookAt to avoid dizziness
        this.camera.lookAt(targetPosition.clone().add(new Vector3(0, 1, 0))); // Look at car center
    }
}
