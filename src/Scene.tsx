
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vehicle } from './vehicle/Vehicle'
import { Engine } from './core/Engine';
import { Lighting } from './graphics/Lighting';
import { Weather } from './graphics/Weather';
import { DynamicWorld } from './core/DynamicWorld';
import { useRef } from 'react';
import { Group } from 'three';
// import { PostProcessing } from './graphics/PostProcessing';

export function Scene() {
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
                {/* <PostProcessing /> */}

                {/* Dynamic World with Infinite Generation */}
                <DynamicWorld terrainGroupRef={terrainGroupRef} />

                {/* Fog for atmosphere */}
                <fog attach="fog" args={['#0f172a', 20, 300]} />

                {/* Vehicle */}
                <Vehicle position={[0, 2, 5]} terrainGroup={terrainGroupRef} />

                {/* Controls - Disable Orbit if using Chase Cam, or keep as debug override */}
                <OrbitControls />
            </Canvas>
        </div>
    )
}
