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
    const resolution = 128;

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

        // ============================================
        // COLOR PALETTE - Natural terrain colors
        // ============================================

        // Grass colors - lush green variations
        const darkGrassColor = new THREE.Color('#3a6b2a');   // Deep green grass
        const lightGrassColor = new THREE.Color('#5a8b4a');  // Medium green grass
        const yellowGrassColor = new THREE.Color('#8b9b4a'); // Yellow-green grass for hills

        // Soil/Dirt colors - brown earth tones
        const richSoilColor = new THREE.Color('#6b4d33');    // Rich brown soil
        const dirtColor = new THREE.Color('#8b7355');        // Light brown dirt
        const sandyDirtColor = new THREE.Color('#a69070');   // Sandy dirt

        // Road shoulder colors
        const gravelColor = new THREE.Color('#7a7060');      // Gray-brown gravel
        const roadEdgeDirtColor = new THREE.Color('#5a4a3a'); // Dark dirt near road

        // Shoulder and transition zone widths - EXPANDED for smoother blending
        const shoulderWidth = 40; // Total transition zone width in meters (Wider for smoother blend)

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
                const finalColor = darkGrassColor.clone();

                // Multi-octave noise for smooth, natural color variation
                const n1 = noise.getNoise(wx * 0.015, wz * 0.015, 0.1); // Large scale variation
                const n2 = noise.getNoise(wx * 0.06, wz * 0.06, 0.1);   // Medium detail
                const n3 = noise.getNoise(wx * 0.12, wz * 0.12, 0.1);   // Fine detail
                const combinedNoise = n1 * 0.5 + n2 * 0.35 + n3 * 0.15;

                // Blend from dark grass to light grass based on noise
                finalColor.lerp(lightGrassColor, combinedNoise * 0.6 + 0.2);

                // Add yellow/dry grass on higher elevations
                const heightFactor = Math.min(1, Math.max(0, (h - 8) / 25));
                const yellowBlend = heightFactor * 0.35 + combinedNoise * 0.15;
                finalColor.lerp(yellowGrassColor, yellowBlend);

                // ============================================
                // DIRT/SOIL PATCHES - Natural earth exposure
                // ============================================

                // Random dirt patches based on noise (simulating bare earth)
                const dirtNoise = noise.getNoise(wx * 0.08, wz * 0.08, 0.3);
                const dirtNoise2 = noise.getNoise(wx * 0.2, wz * 0.2, 0.5);
                const combinedDirt = dirtNoise * 0.7 + dirtNoise2 * 0.3;

                if (combinedDirt > 0.55) {
                    // Exposed soil/dirt patches
                    const dirtBlend = (combinedDirt - 0.55) * 2.0; // 0 to ~0.9
                    finalColor.lerp(richSoilColor, dirtBlend * 0.6);
                }

                // Sandy/dry dirt in low areas
                const lowAreaNoise = noise.getNoise(wx * 0.05, wz * 0.05, 0.2);
                if (h < 3 && lowAreaNoise > 0.4) {
                    const sandBlend = (1 - h / 3) * (lowAreaNoise - 0.4) * 2;
                    finalColor.lerp(sandyDirtColor, sandBlend * 0.4);
                }

                // ============================================
                // ROAD INTEGRATION - Smooth terrain blending
                // ============================================

                if (roadMask) {
                    const distToRoad = roadMask.getDistanceToRoad(wx, wz);
                    const roadH = roadMask.getRoadHeight(wx, wz);
                    const width = roadMask.getWidth();
                    const halfWidth = width * 0.5;

                    if (roadH !== null) {
                        // Under road surface - flatten completely
                        if (distToRoad < halfWidth) {
                            h = roadH - 0.08; // Slightly below road
                            // Dark dirt color (won't be visible under road)
                            finalColor.copy(roadEdgeDirtColor).multiplyScalar(0.6);
                        }
                        // Immediate gravel shoulder (4m wide - wider)
                        else if (distToRoad < halfWidth + 4) {
                            const blend = (distToRoad - halfWidth) / 4;
                            const smoothBlend = blend * blend * (3 - 2 * blend); // smoothstep

                            // Height: Very close to road level
                            h = MathUtils.lerp(roadH - 0.05, roadH + 0.1, smoothBlend);

                            // Color: Gravel/dirt shoulder
                            finalColor.lerp(gravelColor, 1 - smoothBlend * 0.5);
                            finalColor.lerp(dirtColor, smoothBlend * 0.3);
                        }
                        // Dirt/grass transition zone (12m wide - wider)  
                        else if (distToRoad < halfWidth + 16) {
                            const blend = (distToRoad - halfWidth - 4) / 12;
                            const smoothBlend = blend * blend * (3 - 2 * blend);

                            // Height: Gradual slope from road level to natural terrain
                            h = MathUtils.lerp(roadH + 0.1, h, smoothBlend * 0.8 + 0.2);

                            // Color: Transition from dirt to grass
                            const dirtAmount = 1 - smoothBlend;
                            finalColor.lerp(dirtColor, dirtAmount * 0.5);
                        }
                        // Extended grass transition (20m more - wider)
                        else if (distToRoad < halfWidth + shoulderWidth) {
                            const blend = (distToRoad - halfWidth - 16) / 20;
                            const smoothBlend = blend * blend * (3 - 2 * blend);

                            // Height: Very gentle blend to natural terrain
                            h = MathUtils.lerp(roadH * 0.2 + h * 0.8, h, smoothBlend);

                            // Color: Subtle dirt tint near road fades out
                            finalColor.lerp(darkGrassColor, (1 - smoothBlend) * 0.2);
                        }
                    }
                }

                // Set Z (height) - geometry is rotated so Z is up
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
