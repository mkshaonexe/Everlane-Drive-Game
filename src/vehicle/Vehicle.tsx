import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Object3D } from 'three';
import { VehicleModel } from './VehicleModel';
import { VehiclePhysics } from './VehiclePhysics';
import { VehicleController } from './VehicleController';
import { CameraController } from './CameraController';

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

        // 3. Update Visuals
        groupRef.current.position.copy(physics.position);
        groupRef.current.quaternion.copy(physics.rotation);

        // 4. Update Camera
        cameraController.update(physics.position, physics.rotation, dt);
    });

    return (
        <group ref={groupRef}>
            <VehicleModel />
        </group>
    );
}
