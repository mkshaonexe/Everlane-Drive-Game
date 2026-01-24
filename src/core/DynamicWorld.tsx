import { useRef, useState, useMemo, useEffect, startTransition } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { TerrainChunk } from '../terrain/TerrainChunk';
import { Vegetation } from '../graphics/Vegetation';
import { RoadMesh } from '../terrain/RoadMesh';
import { ChunkManager } from '../core/ChunkManager';
import { NoiseGenerator } from '../terrain/NoiseGenerator';
import { RoadGenerator } from '../terrain/RoadGenerator';
import { useGameStore } from '../stores/gameStore';
import { RoadMask } from '../utils/RoadMask';

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

    // Sync to store on mount and updates
    useEffect(() => {
        useGameStore.getState().setRoadPath(roadPath.points);
    }, [roadPath]);

    // Create optimized RoadMask for terrain and vegetation
    const roadMask = useMemo(() => new RoadMask(roadPath, 12), [roadPath]);

    const [loadedChunks, setLoadedChunks] = useState<Vector3[]>(() => {
        // Load initial chunks
        const vehiclePos = useGameStore.getState().position;
        const update = chunkManager.update(vehiclePos);
        return update.chunksToLoad;
    });

    const lastExtensionZ = useRef(0);
    const frameCounter = useRef(0);

    // Dynamic chunk loading based on vehicle position
    // PERF: Throttled to every 3rd frame to reduce React re-renders
    useFrame(() => {
        frameCounter.current++;

        // Only run every 3rd frame to reduce load
        if (frameCounter.current % 3 !== 0) return;

        const vehiclePos = useGameStore.getState().position;

        // Extend road if vehicle is getting close to the end
        const roadEndZ = roadGen.getLastPoint().z;
        const distanceToEnd = roadEndZ - vehiclePos.z;

        if (distanceToEnd < 400 && roadEndZ > lastExtensionZ.current + 100) {
            // Extend road by 400m - use startTransition for non-blocking update
            const newPath = roadGen.extendPath(400);
            startTransition(() => {
                setRoadPath(newPath);
            });
            lastExtensionZ.current = roadEndZ;
        }

        // Update chunks
        const update = chunkManager.update(vehiclePos);

        if (update.chunksToLoad.length > 0 || update.chunksToUnload.length > 0) {
            // Use startTransition to defer chunk state updates (non-blocking)
            startTransition(() => {
                setLoadedChunks(prev => {
                    // Create a set of IDs to unload for fast lookup
                    const unloadIds = new Set(update.chunksToUnload);

                    // Filter out chunks that need to be unloaded
                    const keptChunks = prev.filter(c => !unloadIds.has(`${c.x}_${c.z}`));

                    // Filter new chunks to ensure no duplicates (sanity check)
                    const currentIds = new Set(keptChunks.map(c => `${c.x}_${c.z}`));
                    const newChunks = update.chunksToLoad.filter(
                        c => !currentIds.has(`${c.x}_${c.z}`)
                    );

                    return [...keptChunks, ...newChunks];
                });
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
                            roadMask={roadMask}
                        />
                        <Vegetation
                            chunkPosition={[pos.x, pos.y, pos.z] as [number, number, number]}
                            noise={noise}
                            roadMask={roadMask}
                        />
                    </group>
                ))}
            </group>

            {/* Procedural Road */}
            <RoadMesh path={roadPath} />
        </group>
    );
}
