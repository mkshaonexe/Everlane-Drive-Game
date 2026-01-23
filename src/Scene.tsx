import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { Vehicle } from './components/Vehicle'

export function Scene() {
    return (
        <div className="w-full h-full bg-slate-900">
            <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
                {/* Lights */}
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                <Environment preset="sunset" />

                {/* World Objects */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial color="#333" />
                </mesh>

                <gridHelper args={[100, 100]} />

                {/* Vehicle */}
                <Vehicle position={[0, 1, 0]} />

                {/* Controls */}
                <OrbitControls />
            </Canvas>
        </div>
    )
}
