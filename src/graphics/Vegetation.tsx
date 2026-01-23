import { useRef, useLayoutEffect } from 'react';
import { InstancedMesh, Object3D } from 'three';
import { NoiseGenerator } from '../terrain/NoiseGenerator';
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
}

export function Vegetation({ chunkPosition, noise, count = 200 }: VegetationProps) {
    // Refs for three layers: Trunks, Golden Foliage, Orange Foliage
    const trunkRef = useRef<InstancedMesh>(null);
    const goldRef = useRef<InstancedMesh>(null);
    const orangeRef = useRef<InstancedMesh>(null);

    useLayoutEffect(() => {
        if (!trunkRef.current || !goldRef.current || !orangeRef.current) return;

        const tempObj = new Object3D();
        const [chunkX, , chunkZ] = chunkPosition;

        // Counters for each mesh
        let trunkIdx = 0;
        let goldIdx = 0;
        let orangeIdx = 0;

        for (let i = 0; i < count; i++) {
            // Random position in chunk (assuming 60x60 chunk size effectively)
            const x = (Math.random() - 0.5) * 60;
            const z = (Math.random() - 0.5) * 60;

            // Road Avoidance Area (approx 12m wide)
            if (Math.abs(x) < 6) continue;

            const worldX = chunkX + x;
            const worldZ = chunkZ + z;
            const y = noise.getHeight(worldX, worldZ);

            // Positioning
            const scale = 0.8 + Math.random() * 0.4;
            const rotation = Math.random() * Math.PI * 2;

            // 1. Trunk
            tempObj.position.set(x, y + 1.5 * scale, z); // Adjust y based on pivot
            tempObj.scale.set(scale, scale, scale);
            tempObj.rotation.set(0, rotation, 0);
            tempObj.updateMatrix();
            trunkRef.current.setMatrixAt(trunkIdx++, tempObj.matrix);

            // 2. Foliage (Offset up)
            tempObj.position.set(x, y + 4.5 * scale, z); // Foliage sits higher
            tempObj.scale.set(scale, scale, scale);
            tempObj.rotation.set(0, rotation, 0); // Match rotation
            tempObj.updateMatrix();

            // Randomly assign to Gold or Orange
            if (Math.random() > 0.5) {
                goldRef.current.setMatrixAt(goldIdx++, tempObj.matrix);
            } else {
                orangeRef.current.setMatrixAt(orangeIdx++, tempObj.matrix);
            }
        }

        // Update counts and flags
        trunkRef.current.count = trunkIdx;
        goldRef.current.count = goldIdx;
        orangeRef.current.count = orangeIdx;

        trunkRef.current.instanceMatrix.needsUpdate = true;
        goldRef.current.instanceMatrix.needsUpdate = true;
        orangeRef.current.instanceMatrix.needsUpdate = true;

    }, [chunkPosition, noise, count]);

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
