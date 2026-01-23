import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Object3D, Vector3, Quaternion, Matrix4 } from 'three';
import { VehicleModel } from './VehicleModel';
import { VehiclePhysics } from './VehiclePhysics';
import { VehicleController } from './VehicleController';
import { CameraController } from './CameraController';
import { AmbientAudio } from '../audio/AmbientAudio';
import { EngineAudio } from '../audio/EngineAudio';
import { useGameStore } from '../stores/gameStore';

interface VehicleProps {
    position?: [number, number, number];
    terrainGroup?: React.MutableRefObject<Group | null>;
}

export function Vehicle({ position = [0, 5, 0], terrainGroup }: VehicleProps) {
    const groupRef = useRef<Group>(null);
    const { camera } = useThree();

    // Initialize systems
    const physics = useMemo(() => {
        const p = new VehiclePhysics();
        p.position.set(...position);
        return p;
    }, []);

    const controller = useMemo(() => new VehicleController(), []);
    const cameraController = useMemo(() => new CameraController(camera), [camera]);

    // Cleanup controller events
    useEffect(() => {
        return () => controller.dispose();
    }, [controller]);

    const engineAudio = useMemo(() => new EngineAudio(), []);

    useEffect(() => {
        engineAudio.start();
        return () => engineAudio.stop();
    }, [engineAudio]);

    const speedRef = useRef(0);

    useFrame((_state, delta) => {
        if (!groupRef.current) return;

        // 1. Get Colliders
        const colliders: Object3D[] = [];
        if (terrainGroup && terrainGroup.current) {
            colliders.push(...terrainGroup.current.children);
        }

        // 2. Update Physics
        // Limit delta to avoid physics explosion on large lags
        const dt = Math.min(delta, 0.1);
        physics.update(dt, controller.input, colliders);

        // Update Audio
        const speed = physics.velocity.length();
        engineAudio.update(speed);
        speedRef.current = speed;

        // Update UI Store (throttled slightly if needed, but per frame is fine for simple store)
        const { setSpeed, addDistance, setPosition, isFreeLookActive, freeLookYaw, freeLookPitch, roadPath } = useGameStore.getState();
        setSpeed(speed);
        addDistance(speed * dt); // Distance = Speed * Time
        setPosition(physics.position.clone()); // Clone to avoid reference issues

        // Handle Respawn (R key)
        if (controller.input.reset && roadPath.length > 0) {
            // Find nearest point on road
            // Since road points are ordered, we can just find closest one by distance
            // Optimization: Start search from last known closest index if we tracked it, 
            // but simplified search is fast enough for <1000 points on event trigger (not every frame)

            let closestPoint = roadPath[0];
            let minDistanceSq = physics.position.distanceToSquared(roadPath[0]);
            let closestIndex = 0;

            for (let i = 1; i < roadPath.length; i++) {
                const dSq = physics.position.distanceToSquared(roadPath[i]);
                if (dSq < minDistanceSq) {
                    minDistanceSq = dSq;
                    closestPoint = roadPath[i];
                    closestIndex = i;
                }
            }

            // Calculate road direction for rotation
            // Use next point or prev point to get tangent
            const nextPoint = roadPath[closestIndex + 1] || closestPoint;
            const prevPoint = roadPath[closestIndex - 1] || closestPoint;

            const tangent = new Vector3().subVectors(nextPoint, prevPoint).normalize();

            // Set position slightly above road
            physics.position.copy(closestPoint);
            physics.position.y += 2.0;

            // Reset Velocity
            physics.velocity.set(0, 0, 0);
            physics.angularVelocity.set(0, 0, 0);

            // Set Rotation to face road direction
            // Create rotation looking down the road (tangent)
            // Up vector is Y (0, 1, 0)
            const targetRotation = new Quaternion();
            const lookPos = closestPoint.clone().add(tangent);

            // Use dummy object to compute lookAt quaternion easily or manual calculation
            // Manual: Matrix4.lookAt equivalent
            const m = new Matrix4();
            m.lookAt(closestPoint, lookPos, new Vector3(0, 1, 0));
            targetRotation.setFromRotationMatrix(m);

            physics.rotation.copy(targetRotation);

            // Reset input to prevent constant respawning if key held
            controller.input.reset = false;
        }

        // 3. Update Visuals
        groupRef.current.position.copy(physics.position);
        groupRef.current.quaternion.copy(physics.rotation);

        // 4. Update Camera with free look state
        cameraController.setFreeLook(isFreeLookActive, freeLookYaw, freeLookPitch);
        cameraController.update(physics.position, physics.rotation, dt);
    });

    return (
        <group ref={groupRef}>
            <VehicleModel />
            <AmbientAudio speedRef={speedRef} />
        </group>
    );
}
