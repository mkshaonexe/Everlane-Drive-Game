import { useRef, useState, useMemo, useEffect, startTransition, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, CatmullRomCurve3 } from 'three';
import { TerrainChunk } from '../terrain/TerrainChunk';
import { Vegetation } from '../graphics/Vegetation';
import { RoadMesh } from '../terrain/RoadMesh';
import { ChunkManager } from '../core/ChunkManager';
import { NoiseGenerator } from '../terrain/NoiseGenerator';
import { RoadGenerator } from '../terrain/RoadGenerator';
import { useGameStore } from '../stores/gameStore';
import { RoadMask } from '../utils/RoadMask';
import type { RoadWorkerInput, RoadWorkerResponse, RoadPoint } from '../workers/workerTypes';

interface DynamicWorldProps {
    terrainGroupRef: React.RefObject<Group | null>;
}

// Create road worker once and reuse
let roadWorker: Worker | null = null;
let roadWorkerCallback: ((response: RoadWorkerResponse) => void) | null = null;

function getRoadWorker(): Worker {
    if (!roadWorker) {
        roadWorker = new Worker(
            new URL('../workers/RoadWorker.ts', import.meta.url),
            { type: 'module' }
        );

        roadWorker.onmessage = (event: MessageEvent<RoadWorkerResponse>) => {
            if (roadWorkerCallback) {
                roadWorkerCallback(event.data);
            }
        };
    }
    return roadWorker;
}

// Convert RoadPoint array to CatmullRomCurve3
function pointsToCurve(points: RoadPoint[]): CatmullRomCurve3 {
    const vectors = points.map(p => new Vector3(p.x, p.y, p.z));
    return new CatmullRomCurve3(vectors);
}

// Convert Vector3 to RoadPoint
function vectorToPoint(v: Vector3): RoadPoint {
    return { x: v.x, y: v.y, z: v.z };
}

export function DynamicWorld({ terrainGroupRef }: DynamicWorldProps) {
    const noise = useRef(new NoiseGenerator()).current;
    const roadGen = useRef(new RoadGenerator(noise)).current;
    const chunkManager = useRef(new ChunkManager()).current;

    // Track road state for worker communication
    const roadStateRef = useRef({
        allPoints: [] as RoadPoint[],
        lastPoint: { x: 0, y: 0, z: 0 } as RoadPoint,
        lastDirection: { x: 0, y: 0, z: 1 } as RoadPoint,
        isExtending: false
    });

    // Initial road generation (sync for first load, then async for extensions)
    const [roadPath, setRoadPath] = useState(() => {
        const initialPath = roadGen.generatePath(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 600);

        // Store initial state for worker
        const points = initialPath.getPoints(Math.floor(initialPath.getLength() / 20));
        roadStateRef.current.allPoints = points.map(vectorToPoint);
        roadStateRef.current.lastPoint = vectorToPoint(roadGen.getLastPoint());
        roadStateRef.current.lastDirection = { x: 0, y: 0, z: 1 };

        return initialPath;
    });

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

    // Async road extension using worker
    const extendRoadAsync = useCallback((additionalLength: number) => {
        if (roadStateRef.current.isExtending) return;

        roadStateRef.current.isExtending = true;

        const worker = getRoadWorker();

        const input: RoadWorkerInput = {
            type: 'EXTEND_PATH',
            lastPoint: roadStateRef.current.lastPoint,
            lastDirection: roadStateRef.current.lastDirection,
            allPoints: roadStateRef.current.allPoints,
            additionalLength,
            noiseSeed: 'slow-roads'
        };

        roadWorkerCallback = (response) => {
            roadStateRef.current.isExtending = false;

            if (response.type === 'ROAD_ERROR') {
                console.warn('Road worker error:', response.error);
                return;
            }

            // Update state
            roadStateRef.current.allPoints = response.points;
            roadStateRef.current.lastPoint = response.lastPoint;
            roadStateRef.current.lastDirection = response.lastDirection;

            // Create new curve from worker results
            const newCurve = pointsToCurve(response.points);

            startTransition(() => {
                setRoadPath(newCurve);
            });
        };

        worker.postMessage(input);
    }, []);

    // Dynamic chunk loading based on vehicle position
    // PERF: Throttled to every 3rd frame to reduce React re-renders
    useFrame(() => {
        frameCounter.current++;

        // Only run every 3rd frame to reduce load
        if (frameCounter.current % 3 !== 0) return;

        const vehiclePos = useGameStore.getState().position;

        // Extend road if vehicle is getting close to the end
        const roadEndZ = roadStateRef.current.lastPoint.z;
        const distanceToEnd = roadEndZ - vehiclePos.z;

        if (distanceToEnd < 400 && roadEndZ > lastExtensionZ.current + 100) {
            // Extend road by 400m - use async worker
            extendRoadAsync(400);
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
