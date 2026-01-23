import { useMemo } from 'react';
import { DoubleSide, Mesh, MathUtils } from 'three';
import * as THREE from 'three';
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

    // Resolution of the chunk (vertices per edge)
    const resolution = 64;

    return (
        <group position={position}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
                <planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE, resolution - 1, resolution - 1]} />
                <ChunkMeshLogic noise={noise} worldX={x} worldZ={z} resolution={resolution} roadMask={roadMask} />
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

const ChunkMeshLogic = ({ noise, worldX, worldZ, resolution, roadMask }: { noise: NoiseGenerator, worldX: number, worldZ: number, resolution: number, roadMask?: RoadMask }) => {
    useMemo(() => {
        return null;
    }, []);

    return (
        <mesh
            visible={false}
            userData={{
                noise,
                worldX,
                worldZ,
                resolution
            }}
            onUpdate={(self) => {
                const parent = self.parent as Mesh;
                if (!parent || !parent.geometry) return;

                // Force update if roadMask changes or on first load
                // We use a timestamp or check if generated with current mask
                if ((parent.geometry as any).userData?.generated) return;
                if (!(parent.geometry as any).userData) (parent.geometry as any).userData = {};

                const pos = parent.geometry.attributes.position as any;

                // Add color attribute if missing
                if (!parent.geometry.attributes.color) {
                    const colors = new Float32Array(pos.count * 3);
                    parent.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                }
                const col = parent.geometry.attributes.color as any;

                // Color palette
                const grassColor = new THREE.Color('#5c8d45');
                const grassVarColor = new THREE.Color('#7da156'); // Lighter grass
                const mudColor = new THREE.Color('#5d4037'); // Dark brown
                const dryColor = new THREE.Color('#8d6e63'); // Light brown

                for (let i = 0; i < pos.count; i++) {
                    const lx = pos.getX(i);
                    const ly = pos.getY(i);

                    // World coords
                    const wx = worldX + lx;
                    const wz = worldZ + ly;

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
                                const t = blend * blend * (3 - 2 * blend);
                                h = MathUtils.lerp(roadH - 0.2, h, t);

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
                parent.geometry.computeVertexNormals();
                (parent.geometry as any).userData.generated = true;
            }}
        />
    )
}
