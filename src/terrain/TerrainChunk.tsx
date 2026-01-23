import { useLayoutEffect, useRef } from 'react';
import { DoubleSide, Mesh } from 'three';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { NoiseGenerator } from './NoiseGenerator';
import { CHUNK_SIZE } from '../utils/constants';
import { RoadMask } from '../utils/RoadMask';

interface TerrainChunkProps {
    position: [number, number, number];
    noise: NoiseGenerator;
    roadMask?: RoadMask;
}

export const TerrainChunk = ({ position, noise, roadMask }: TerrainChunkProps) => {
    const [x, , z] = position;
    const meshRef = useRef<Mesh>(null);

    // Resolution of the chunk (vertices per edge)
    const resolution = 64;

    useLayoutEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const geometry = mesh.geometry;
        if (!geometry) return;

        // Reset generated flag if we are regenerating
        // Accessing userData type-safely can be annoying in TS, casting to any for convenience here
        if ((geometry as any).userData?.generated &&
            (geometry as any).userData.worldX === x &&
            (geometry as any).userData.worldZ === z) {
            return;
        }

        const pos = geometry.attributes.position;
        if (!pos || !pos.count) return;

        // Add color attribute if missing
        if (!geometry.attributes.color) {
            const colors = new Float32Array(pos.count * 3);
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        }
        const col = geometry.attributes.color;

        // Color palette - matching reference images with natural grass colors
        const darkGrassColor = new THREE.Color('#4a7c3c'); // Deep green grass
        const lightGrassColor = new THREE.Color('#6b9b4d'); // Medium green grass
        const yellowGrassColor = new THREE.Color('#9bab5a'); // Yellow-green grass for hills
        const brownGrassColor = new THREE.Color('#8b8b4b'); // Dry brownish grass accent

        try {
            for (let i = 0; i < pos.count; i++) {
                const lx = pos.getX(i);
                const ly = pos.getY(i);

                // World coords
                const wx = x + lx;
                const wz = z + ly;

                // Get base height from noise
                let h = noise.getHeight(wx, wz);

                // Base grass color with smooth variation
                let finalColor = darkGrassColor.clone();

                // Multi-octave noise for smooth, natural color variation
                const n1 = noise.getNoise(wx * 0.02, wz * 0.02, 0.1); // Large scale variation
                const n2 = noise.getNoise(wx * 0.08, wz * 0.08, 0.1); // Medium detail
                const combinedNoise = n1 * 0.6 + n2 * 0.4;

                // Blend from dark grass to light grass based on noise
                finalColor.lerp(lightGrassColor, combinedNoise * 0.5 + 0.3);

                // Add yellow/dry grass on higher elevations and sun-facing slopes
                const heightFactor = Math.min(1, Math.max(0, (h - 5) / 20)); // Higher areas get yellower
                const yellowBlend = heightFactor * 0.4 + combinedNoise * 0.2;
                finalColor.lerp(yellowGrassColor, yellowBlend);

                // Subtle brown accent based on different noise frequency
                const brownNoise = noise.getNoise(wx * 0.15, wz * 0.15, 0.2);
                if (brownNoise > 0.6) {
                    finalColor.lerp(brownGrassColor, (brownNoise - 0.6) * 0.3);
                }

                // Flatten under road - keep grass color, just flatten terrain
                if (roadMask) {
                    const distToRoad = roadMask.getDistanceToRoad(wx, wz);
                    const roadH = roadMask.getRoadHeight(wx, wz);
                    const width = roadMask.getWidth();
                    const halfWidth = width * 0.5;

                    if (roadH !== null) {
                        if (distToRoad < halfWidth) {
                            // Under road surface - flatten slightly below road
                            h = roadH - 0.15;
                            // Keep a subtle dark grass color under road (won't be visible)
                            finalColor.copy(darkGrassColor).multiplyScalar(0.7);
                        } else if (distToRoad < halfWidth + 2) {
                            // Very close to road edge - smooth grass shoulder (2m wide)
                            const blend = (distToRoad - halfWidth) / 2;
                            const val = blend * blend * (3 - 2 * blend); // smoothstep
                            h = MathUtils.lerp(roadH - 0.1, h, val);
                            // Keep grass color - just slightly darker near road edge
                            finalColor.lerp(darkGrassColor, (1 - blend) * 0.3);
                        } else if (distToRoad < halfWidth + 6) {
                            // Extended transition zone (4m more) - gradual height blend
                            const blend = (distToRoad - halfWidth - 2) / 4;
                            const val = blend * blend * (3 - 2 * blend);
                            // Gentle height blending
                            h = MathUtils.lerp(roadH, h, val * 0.5 + 0.5);
                        }
                    }
                }

                // Set Z
                pos.setZ(i, h);

                // Set Color
                col.setXYZ(i, finalColor.r, finalColor.g, finalColor.b);
            }

            pos.needsUpdate = true;
            col.needsUpdate = true;
            geometry.computeVertexNormals();

            // Mark as generated with metadata
            (geometry as any).userData = {
                generated: true,
                worldX: x,
                worldZ: z
            };

        } catch (e) {
            console.warn("Error generating chunk mesh:", e);
        }

    }, [x, z, noise, roadMask, resolution]);

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
                castShadow
            >
                <planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE, resolution - 1, resolution - 1]} />
                <meshStandardMaterial
                    vertexColors={true}
                    roughness={1.0}
                    side={DoubleSide}
                    wireframe={false}
                />
            </mesh>
        </group>
    );
};
