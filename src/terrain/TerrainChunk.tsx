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

        // Color palette
        const grassColor = new THREE.Color('#5c8d45');
        const grassVarColor = new THREE.Color('#7da156'); // Lighter grass
        const mudColor = new THREE.Color('#5d4037'); // Dark brown
        const dryColor = new THREE.Color('#8d6e63'); // Light brown

        try {
            for (let i = 0; i < pos.count; i++) {
                const lx = pos.getX(i);
                const ly = pos.getY(i);

                // World coords
                const wx = x + lx;
                const wz = z + ly;

                // Get base height from noise
                let h = noise.getHeight(wx, wz);

                // Base color logic
                let finalColor = grassColor.clone();

                // Noise for color variation
                const n = noise.getNoise(wx, wz, 0.1);
                finalColor.lerp(grassVarColor, n * 0.5 + 0.5);

                // Flatten under road
                if (roadMask) {
                    const distToRoad = roadMask.getDistanceToRoad(wx, wz);
                    const roadH = roadMask.getRoadHeight(wx, wz);
                    const width = roadMask.getWidth();
                    const halfWidth = width * 0.5;

                    if (roadH !== null) {
                        if (distToRoad < halfWidth) {
                            // Strictly under road - flatten completely
                            h = roadH - 0.2;
                            // Dark mud under road
                            finalColor.copy(mudColor).multiplyScalar(0.8);
                        } else if (distToRoad < halfWidth + 4) {
                            // Shoulder blending zone (4m wide)
                            const blend = (distToRoad - halfWidth) / 4;
                            // Smoothstep blend
                            const val = blend * blend * (3 - 2 * blend);
                            h = MathUtils.lerp(roadH - 0.2, h, val);

                            // Color blend: Mud -> Grass
                            // More mud near road, fading to grass
                            const shoulderColor = mudColor.clone().lerp(dryColor, blend);
                            finalColor.lerp(shoulderColor, 1.0 - blend * 0.8);
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
