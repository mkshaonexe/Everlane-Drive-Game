
import { Canvas } from '@react-three/fiber'

import { Vehicle } from './vehicle/Vehicle'
import { Engine } from './core/Engine';
import { Lighting } from './graphics/Lighting';
import { Weather } from './graphics/Weather';
import { DynamicWorld } from './core/DynamicWorld';
import { useRef } from 'react';
import { Group } from 'three';
import { PostProcessing } from './graphics/PostProcessing';

export function Scene() {
    const terrainGroupRef = useRef<Group>(null);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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

                {/* Dynamic World with Infinite Generation */}
                <DynamicWorld terrainGroupRef={terrainGroupRef} />

                {/* Fog for atmosphere - warm dusty haze */}
                <fog attach="fog" args={['#e5dbc1', 20, 300]} />

                {/* Vehicle - spawn on the road, further along the path */}
                <Vehicle position={[0, 5, 50]} terrainGroup={terrainGroupRef} />

                {/* OrbitControls disabled in favor of CameraController, but can be useful for debug if needed */}
                {/* <OrbitControls /> */}
            </Canvas>
        </div>
    )
}
