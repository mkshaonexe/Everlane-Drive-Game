import { useEffect, useRef, useState } from 'react';
import { DoubleSide, Mesh } from 'three';
import * as THREE from 'three';
import { NoiseGenerator } from './NoiseGenerator';
import { CHUNK_SIZE } from '../utils/constants';
import { RoadMask } from '../utils/RoadMask';
import type { TerrainWorkerInput, TerrainWorkerResponse } from '../workers/workerTypes';

interface TerrainChunkProps {
    position: [number, number, number];
    noise: NoiseGenerator;
    roadMask?: RoadMask;
}

// Create worker once and reuse
let terrainWorker: Worker | null = null;
const pendingChunks = new Map<string, (data: TerrainWorkerResponse) => void>();

function getTerrainWorker(): Worker {
    if (!terrainWorker) {
        terrainWorker = new Worker(
            new URL('../workers/TerrainWorker.ts', import.meta.url),
            { type: 'module' }
        );

        terrainWorker.onmessage = (event: MessageEvent<TerrainWorkerResponse>) => {
            const data = event.data;
            if (data.type === 'TERRAIN_RESULT' || data.type === 'TERRAIN_ERROR') {
                const key = `${data.chunkX}_${data.chunkZ}`;
                const callback = pendingChunks.get(key);
                if (callback) {
                    callback(data);
                    pendingChunks.delete(key);
                }
            }
        };
    }
    return terrainWorker;
}

// @ts-ignore
export const TerrainChunk = ({ position, noise: _noise, roadMask: _roadMask }: TerrainChunkProps) => {
    const [x, , z] = position;
    const meshRef = useRef<Mesh>(null);
    const [_isReady, setIsReady] = useState(false);

    // Resolution of the chunk (vertices per edge)
    const resolution = 128;

    // Request terrain data from worker
    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const geometry = mesh.geometry;
        if (!geometry) return;

        // Check if already generated for this position
        const userData = (geometry as any).userData;
        if (userData?.generated && userData.worldX === x && userData.worldZ === z) {
            setIsReady(true);
            return;
        }

        const chunkKey = `${x}_${z}`;

        // Request terrain generation from worker
        const worker = getTerrainWorker();

        const input: TerrainWorkerInput = {
            type: 'GENERATE_TERRAIN',
            chunkX: x,
            chunkZ: z,
            resolution,
            chunkSize: CHUNK_SIZE,
            noiseSeed: 'everlane-drive'
        };

        // Set up callback for when worker responds
        pendingChunks.set(chunkKey, (response) => {
            if (response.type === 'TERRAIN_ERROR') {
                console.warn('Terrain worker error:', response.error);
                return;
            }

            const mesh = meshRef.current;
            if (!mesh) return;

            const geometry = mesh.geometry;
            if (!geometry) return;

            const pos = geometry.attributes.position;
            if (!pos || !pos.count) return;

            // Apply heights from worker
            const heights = response.heights;
            const colors = response.colors;

            // Add color attribute if missing
            if (!geometry.attributes.color) {
                const colorArray = new Float32Array(pos.count * 3);
                geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
            }
            const col = geometry.attributes.color;

            // Apply worker results to geometry
            // Note: PlaneGeometry vertex order may differ, need to map correctly
            for (let i = 0; i < pos.count && i < heights.length; i++) {
                // Set Z (height) - geometry is rotated so Z is up
                pos.setZ(i, heights[i]);

                // Set color
                if (i * 3 + 2 < colors.length) {
                    col.setXYZ(i, colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
                }
            }

            pos.needsUpdate = true;
            col.needsUpdate = true;
            geometry.computeVertexNormals();

            // Mark as generated
            (geometry as any).userData = {
                generated: true,
                worldX: x,
                worldZ: z
            };

            setIsReady(true);
        });

        // Post message to worker
        worker.postMessage(input);

        // Cleanup on unmount
        return () => {
            pendingChunks.delete(chunkKey);
        };
    }, [x, z, resolution]);

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE, resolution - 1, resolution - 1]} />
                <meshStandardMaterial
                    vertexColors={true}
                    roughness={0.95}
                    side={DoubleSide}
                    wireframe={false}
                />
            </mesh>
        </group>
    );
};
