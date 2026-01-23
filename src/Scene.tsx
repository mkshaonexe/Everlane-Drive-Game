import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { Vehicle } from './vehicle/Vehicle'
import { Engine } from './core/Engine';
import { TerrainChunk } from './terrain/TerrainChunk';
import { NoiseGenerator } from './terrain/NoiseGenerator';
import { RoadGenerator } from './terrain/RoadGenerator';
import { RoadMesh } from './terrain/RoadMesh';
import { useMemo, useRef } from 'react';
import { Vector3, Group } from 'three';
import { CHUNK_SIZE } from './utils/constants';

export function Scene() {
    const noise = useMemo(() => new NoiseGenerator(), []);
    const roadPath = useMemo(() => {
        const roadGen = new RoadGenerator(noise);
        // Generate a road starting at 0,0,0 going forward
        return roadGen.generatePath(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 400);
    }, [noise]);

    const terrainGroupRef = useRef<Group>(null);

    return (
        <div className="w-full h-full bg-slate-900">
            <Canvas shadows camera={{ position: [0, 50, 100], fov: 50 }}>
                {/* Core Engine Loop */}
                <Engine
                    onPhysicsUpdate={(_dt) => {
                        // console.log("Fixed step", dt);
                    }}
                />

                {/* Lights */}
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 50, 20]}
                    intensity={1.5}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                <Environment preset="sunset" />

                {/* Collidable Group (Terrain + Road) */}
                <group ref={terrainGroupRef}>
                    {/* Terrain Chunks (3x3 grid around center) */}
                    <group>
                        <TerrainChunk position={[0, 0, 0]} noise={noise} />
                        <TerrainChunk position={[CHUNK_SIZE, 0, 0]} noise={noise} />
                        <TerrainChunk position={[-CHUNK_SIZE, 0, 0]} noise={noise} />
                        <TerrainChunk position={[0, 0, CHUNK_SIZE]} noise={noise} />
                        <TerrainChunk position={[0, 0, -CHUNK_SIZE]} noise={noise} />
                    </group>

                    {/* Procedural Road */}
                    <RoadMesh path={roadPath} />
                </group>

                {/* Vehicle */}
                <Vehicle position={[0, 10, 0]} terrainGroup={terrainGroupRef} />

                {/* Controls - Disable Orbit if using Chase Cam, or keep as debug override */}
                {/* <OrbitControls /> */}
                <gridHelper args={[500, 10]} />
            </Canvas>
        </div>
    )
}
