import { useMemo } from 'react';
import { DoubleSide, Mesh } from 'three';
import { NoiseGenerator } from './NoiseGenerator';
import { CHUNK_SIZE } from '../utils/constants';

interface TerrainChunkProps {
    position: [number, number, number];
    noise: NoiseGenerator;
}

export const TerrainChunk = ({ position, noise }: TerrainChunkProps) => {
    const [x, , z] = position;

    // Resolution of the chunk (vertices per edge)
    const resolution = 64;



    // Simpler approach: Use standard PlaneGeometry and displace it


    return (
        <group position={position}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
                <planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE, resolution - 1, resolution - 1]} />
                {/* We need to modify vertex heights. Using a custom material or updating geometry.
            For MVP let's do geometry manipulation in a useEffect or useMemo.
        */}
                <ChunkMeshLogic noise={noise} worldX={x} worldZ={z} resolution={resolution} />
                <meshStandardMaterial
                    color="#5a8f4c"
                    roughness={0.8}
                    side={DoubleSide}
                    wireframe={false}
                />
            </mesh>
        </group>
    );
};

// Separated logic to access the geometry
const ChunkMeshLogic = ({ noise, worldX, worldZ, resolution }: { noise: NoiseGenerator, worldX: number, worldZ: number, resolution: number }) => {
    useMemo(() => {
        // This is a placeholder. 
        // In R3F, we usually ref the mesh and modify geometry.attributes.position.
        // But preventing direct DOM manipulation in render body.
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

                const pos = parent.geometry.attributes.position as any;
                if (pos.userData.generated) return;

                for (let i = 0; i < pos.count; i++) {
                    const lx = pos.getX(i);
                    const ly = pos.getY(i); // This is Z in plane geometry (up is Y here but rotated)
                    // Actually plane is X-Y, rotated X-Z. 

                    // World coords
                    const wx = worldX + lx;
                    const wz = worldZ + ly; // ly is local y (which becomes world z after rotation)

                    // Get height
                    const h = noise.getHeight(wx, wz);

                    // Set Z (which is world Y)
                    pos.setZ(i, h);
                }

                pos.needsUpdate = true;
                parent.geometry.computeVertexNormals();
                pos.userData.generated = true;
            }}
        />
    )
}
