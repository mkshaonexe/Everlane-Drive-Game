import { useRef, useLayoutEffect } from 'react';
import { InstancedMesh, Object3D } from 'three';
import { NoiseGenerator } from '../terrain/NoiseGenerator';
import { RoadMask } from '../utils/RoadMask';
import {
    birchTrunkGeometry,
    birchFoliageGeometry,
    birchBarkMaterial,
    goldenFoliageMaterial,
    orangeFoliageMaterial
} from './TreeModels';

interface VegetationProps {
    chunkPosition: [number, number, number];
    noise: NoiseGenerator;
    count?: number;
    roadMask?: RoadMask;
}

export function Vegetation({ chunkPosition, noise, count = 200, roadMask }: VegetationProps) {
    // Refs for three layers: Trunks, Golden Foliage, Orange Foliage
    const trunkRef = useRef<InstancedMesh>(null);
    const goldRef = useRef<InstancedMesh>(null);
    const orangeRef = useRef<InstancedMesh>(null);

    useLayoutEffect(() => {
        if (!trunkRef.current || !goldRef.current || !orangeRef.current) return;
        if (!noise) return;

        const tempObj = new Object3D();
        const [chunkX, , chunkZ] = chunkPosition;

        // Counters for each mesh
        let trunkIdx = 0;
        let goldIdx = 0;
        let orangeIdx = 0;

        try {
            for (let i = 0; i < count; i++) {
                // Random position in chunk (60x60 effective area)
                const x = (Math.random() - 0.5) * 60;
                const z = (Math.random() - 0.5) * 60;

                const worldX = chunkX + x;
                const worldZ = chunkZ + z;

                // Road Avoidance - check efficient RoadMask
                if (roadMask) {
                    const distToRoad = roadMask.getDistanceToRoad(worldX, worldZ);
                    if (distToRoad < 12) continue; // Keep 12m clearance from road center for clean roadside
                }

                const y = noise.getHeight(worldX, worldZ);

                // Positioning
                const scale = 0.8 + Math.random() * 0.4;
                const rotation = Math.random() * Math.PI * 2;

                // 1. Trunk
                tempObj.position.set(x, y + 1.5 * scale, z);
                tempObj.scale.set(scale, scale, scale);
                tempObj.rotation.set(0, rotation, 0);
                tempObj.updateMatrix();
                if (trunkIdx < count) trunkRef.current.setMatrixAt(trunkIdx++, tempObj.matrix);

                // 2. Foliage (Offset up)
                tempObj.position.set(x, y + 4.5 * scale, z);
                tempObj.scale.set(scale, scale, scale);
                tempObj.rotation.set(0, rotation, 0);
                tempObj.updateMatrix();

                // Randomly assign to Gold or Orange
                if (Math.random() > 0.5) {
                    if (goldIdx < count) goldRef.current.setMatrixAt(goldIdx++, tempObj.matrix);
                } else {
                    if (orangeIdx < count) orangeRef.current.setMatrixAt(orangeIdx++, tempObj.matrix);
                }
            }

            // Update counts and flags
            trunkRef.current.count = trunkIdx;
            goldRef.current.count = goldIdx;
            orangeRef.current.count = orangeIdx;

            if (trunkRef.current.instanceMatrix) trunkRef.current.instanceMatrix.needsUpdate = true;
            if (goldRef.current.instanceMatrix) goldRef.current.instanceMatrix.needsUpdate = true;
            if (orangeRef.current.instanceMatrix) orangeRef.current.instanceMatrix.needsUpdate = true;
        } catch (e) {
            console.warn("Error generating vegetation:", e);
        }

    }, [chunkPosition, noise, count, roadMask]);

    return (
        <group position={chunkPosition}>
            {/* Trunks */}
            <instancedMesh
                ref={trunkRef}
                args={[birchTrunkGeometry, birchBarkMaterial, count]}
                castShadow
                receiveShadow
            />
            {/* Golden Foliage */}
            <instancedMesh
                ref={goldRef}
                args={[birchFoliageGeometry, goldenFoliageMaterial, count]}
                castShadow
                receiveShadow
            />
            {/* Orange Foliage */}
            <instancedMesh
                ref={orangeRef}
                args={[birchFoliageGeometry, orangeFoliageMaterial, count]}
                castShadow
                receiveShadow
            />
        </group>
    );
}

