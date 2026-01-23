import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { TerrainChunk } from '../terrain/TerrainChunk';
import { Vegetation } from '../graphics/Vegetation';
import { RoadMesh } from '../terrain/RoadMesh';
import { ChunkManager } from '../core/ChunkManager';
import { NoiseGenerator } from '../terrain/NoiseGenerator';
import { RoadGenerator } from '../terrain/RoadGenerator';
import { useGameStore } from '../stores/gameStore';

interface DynamicWorldProps {
    terrainGroupRef: React.RefObject<Group | null>;
}

export function DynamicWorld({ terrainGroupRef }: DynamicWorldProps) {
    const noise = useRef(new NoiseGenerator()).current;
    const roadGen = useRef(new RoadGenerator(noise)).current;
    const chunkManager = useRef(new ChunkManager()).current;

    // Initial road generation
    const [roadPath, setRoadPath] = useState(() =>
        roadGen.generatePath(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 600)
    );

    const [loadedChunks, setLoadedChunks] = useState<Vector3[]>(() => {
        // Load initial chunks
        const vehiclePos = useGameStore.getState().position;
        const update = chunkManager.update(vehiclePos);
        return update.chunksToLoad;
    });

    const lastExtensionZ = useRef(0);

    // Dynamic chunk loading based on vehicle position
    useFrame(() => {
        const vehiclePos = useGameStore.getState().position;

        // Extend road if vehicle is getting close to the end
        const roadEndZ = roadGen.getLastPoint().z;
        const distanceToEnd = roadEndZ - vehiclePos.z;

        if (distanceToEnd < 400 && roadEndZ > lastExtensionZ.current + 100) {
            // Extend road by 400m
            const newPath = roadGen.extendPath(400);
            setRoadPath(newPath);
            lastExtensionZ.current = roadEndZ;
        }

        // Update chunks
        const update = chunkManager.update(vehiclePos);

        if (update.chunksToLoad.length > 0 || update.chunksToUnload.length > 0) {
            // For now, just update with new chunks to load
            // In production, we'd properly unload old chunks from the scene
            setLoadedChunks(prev => {
                const chunkIds = new Set(prev.map(c => `${c.x}_${c.z}`));
                const newChunks = update.chunksToLoad.filter(
                    c => !chunkIds.has(`${c.x}_${c.z}`)
                );
                return [...prev, ...newChunks];
            });
        }
    });

    return (
        <group ref={terrainGroupRef}>
            {/* Dynamically loaded terrain chunks */}
            <group>
                {loadedChunks.map((pos) => (
                    <group key={`${pos.x}_${pos.z}`}>
                        <TerrainChunk
                            position={[pos.x, pos.y, pos.z] as [number, number, number]}
                            noise={noise}
                        />
                        <Vegetation
                            chunkPosition={[pos.x, pos.y, pos.z] as [number, number, number]}
                            noise={noise}
                        />
                    </group>
                ))}
            </group>

            {/* Procedural Road */}
            <RoadMesh path={roadPath} />
        </group>
    );
}
