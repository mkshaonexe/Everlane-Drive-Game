
import { Canvas } from '@react-three/fiber'
import { useRef, useMemo } from 'react';
import { Group } from 'three';

import { Vehicle } from './vehicle/Vehicle'
import { Engine } from './core/Engine';
import { Lighting } from './graphics/Lighting';
import { Weather } from './graphics/Weather';
import { DynamicWorld } from './core/DynamicWorld';
import { GLTFMap } from './core/GLTFMap';
import { PostProcessing } from './graphics/PostProcessing';
import { useGameStore, MAPS } from './stores/gameStore';

export function Scene() {
    const terrainGroupRef = useRef<Group>(null);
    const selectedMap = useGameStore(state => state.selectedMap);

    const mapConfig = useMemo(() => MAPS.find(m => m.id === selectedMap) || MAPS[0], [selectedMap]);
    const isProceduralMap = mapConfig.type === 'procedural';

    // Fog settings from map config
    const fogColor = mapConfig.fogColor || '#e5dbc1';
    const fogNear = mapConfig.fogNear ?? 20;
    const fogFar = mapConfig.fogFar ?? 300;

    // Spawn position from map config
    const spawnPos = mapConfig.spawnPosition || [0, 5, 50];

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Canvas camera={{ position: [0, 50, 100], fov: 50 }}>
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

                {/* Fog for atmosphere - driven by map config */}
                <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

                {/* Map: Procedural or GLTF */}
                {isProceduralMap ? (
                    /* Dynamic World with Infinite Generation */
                    <DynamicWorld terrainGroupRef={terrainGroupRef} />
                ) : (
                    /* GLTF Map */
                    <GLTFMap terrainGroupRef={terrainGroupRef} />
                )}

                {/* Vehicle - spawn position from map config */}
                <Vehicle position={spawnPos as [number, number, number]} terrainGroup={terrainGroupRef} />

                {/* OrbitControls disabled in favor of CameraController, but can be useful for debug if needed */}
                {/* <OrbitControls /> */}
            </Canvas>
        </div>
    )
}
