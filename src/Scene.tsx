import { Canvas } from '@react-three/fiber'
import { Vehicle } from './vehicle/Vehicle'
import { Engine } from './core/Engine';
import { TerrainChunk } from './terrain/TerrainChunk';
import { NoiseGenerator } from './terrain/NoiseGenerator';
import { RoadGenerator } from './terrain/RoadGenerator';
import { RoadMesh } from './terrain/RoadMesh';
import { Lighting } from './graphics/Lighting';
import { Weather } from './graphics/Weather';
import { Vegetation } from './graphics/Vegetation';
import { useMemo, useRef } from 'react';
import { Vector3, Group } from 'three';
import { CHUNK_SIZE } from './utils/constants';
import { PostProcessing } from './graphics/PostProcessing';

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

                {/* Graphics Systems */}
                <Lighting />
                <Weather />
                <PostProcessing />
                {/* <Environment preset="sunset" />  -- Replaced by our dynamic sky/lighting */}

                {/* Collidable Group (Terrain + Road) */}
                <group ref={terrainGroupRef}>
                    {/* Terrain Chunks (3x3 grid around center) */}
                    <group>
                        {[
                            [0, 0, 0],
                            [CHUNK_SIZE, 0, 0],
                            [-CHUNK_SIZE, 0, 0],
                            [0, 0, CHUNK_SIZE],
                            [0, 0, -CHUNK_SIZE]
                        ].map((pos, i) => (
                            <group key={i}>
                                <TerrainChunk position={pos as [number, number, number]} noise={noise} />
                                <Vegetation chunkPosition={pos as [number, number, number]} noise={noise} />
                            </group>
                        ))}
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
