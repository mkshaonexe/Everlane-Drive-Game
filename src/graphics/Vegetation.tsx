import { useMemo, useRef, useLayoutEffect } from 'react';
import { InstancedMesh, Object3D, MeshStandardMaterial, ConeGeometry } from 'three';
import { NoiseGenerator } from '../terrain/NoiseGenerator';

interface VegetationProps {
    chunkPosition: [number, number, number];
    noise: NoiseGenerator;
    count?: number;
}

export function Vegetation({ chunkPosition, noise, count = 50 }: VegetationProps) {
    const meshRef = useRef<InstancedMesh>(null);
    const geometry = useMemo(() => new ConeGeometry(1, 4, 8), []); // Simple pine tree shape
    const material = useMemo(() => new MeshStandardMaterial({ color: '#2d4c1e', roughness: 0.8 }), []);

    useLayoutEffect(() => {
        if (!meshRef.current) return;

        const tempObject = new Object3D();
        const [chunkX, , chunkZ] = chunkPosition;
        let instanceIdx = 0;

        for (let i = 0; i < count; i++) {
            // Random position within chunk (assumed 100x100 chunk size from constants, need to check)
            // Assuming chunk is centered at chunkPosition
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;

            const worldX = chunkX + x;
            const worldZ = chunkZ + z;

            // Get height from noise
            const y = noise.getHeight(worldX, worldZ);

            // Simple "Road Avoidance" - if near center (where road usually is for test), skip
            // Real implementation would check distance to road path
            if (Math.abs(x) < 8) continue; // Skip 16m wide strip in middle

            tempObject.position.set(x, y + 2, z); // +2 to sit on top

            // Random scale
            const scale = 0.8 + Math.random() * 0.5;
            tempObject.scale.set(scale, scale, scale);

            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(instanceIdx, tempObject.matrix);
            instanceIdx++;
        }

        meshRef.current.count = instanceIdx; // Update actual count (filtered)
        meshRef.current.instanceMatrix.needsUpdate = true;

    }, [chunkPosition, noise, count]);

    return (
        <instancedMesh
            ref={meshRef}
            args={[geometry, material, count]}
            castShadow
            receiveShadow
            position={chunkPosition} // Local space relative to chunk center
        />
    );
}
