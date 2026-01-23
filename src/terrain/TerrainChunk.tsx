import { useMemo } from 'react';
import { DoubleSide, Mesh, MathUtils } from 'three';
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
                    color="#5c8d45"
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

                for (let i = 0; i < pos.count; i++) {
                    const lx = pos.getX(i);
                    const ly = pos.getY(i);

                    // World coords
                    const wx = worldX + lx;
                    const wz = worldZ + ly;

                    // Get base height from noise
                    let h = noise.getHeight(wx, wz);

                    // Flatten under road
                    if (roadMask) {
                        const distToRoad = roadMask.getDistanceToRoad(wx, wz);
                        const roadH = roadMask.getRoadHeight(wx, wz);
                        const width = roadMask.getWidth();
                        const halfWidth = width * 0.5;

                        if (roadH !== null) {
                            if (distToRoad < halfWidth) {
                                // Strictly under road - flatten completely
                                // Use road height minus buffer to ensure road sits on top
                                h = roadH - 0.2;
                            } else if (distToRoad < halfWidth + 4) {
                                // Shoulder blending zone (4m wide)
                                const blend = (distToRoad - halfWidth) / 4;
                                // Smoothstep blend
                                const t = blend * blend * (3 - 2 * blend);
                                h = MathUtils.lerp(roadH - 0.2, h, t);
                            }
                        }
                    }

                    // Set Z
                    pos.setZ(i, h);
                }

                pos.needsUpdate = true;
                parent.geometry.computeVertexNormals();
                (parent.geometry as any).userData.generated = true;
            }}
        />
    )
}
