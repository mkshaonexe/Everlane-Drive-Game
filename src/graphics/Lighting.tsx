import { useRef } from 'react';
import { DirectionalLight } from 'three';

export function Lighting() {
    const sunRef = useRef<DirectionalLight>(null);

    // Golden hour lighting - static warm afternoon sun
    // Positioned for late afternoon golden hour aesthetic
    const sunPosition: [number, number, number] = [80, 60, 40]; // Low angle from west

    return (
        <>
            {/* Ambient light - warm autumn tone */}
            <ambientLight
                color="#ffeedd"
                intensity={0.3}
            />

            {/* Hemisphere light for sky/ground color gradient */}
            <hemisphereLight
                color="#ffd4a3" // Warm sky color (golden hour)
                groundColor="#8b7355" // Warm brown earth
                intensity={0.3}
            />

            {/* Directional sun light - golden hour */}
            <directionalLight
                ref={sunRef}
                position={sunPosition}
                color="#ffb347" // Warm orange-peach sunlight
                intensity={2.2} // High contrast
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-150}
                shadow-camera-right={150}
                shadow-camera-top={150}
                shadow-camera-bottom={-150}
                shadow-camera-far={400}
                shadow-bias={-0.0001}
            />

            {/* Subtle fill light from opposite direction (bounce light simulation) */}
            <directionalLight
                position={[-40, 30, -30]}
                color="#acc5e6" // Cool blue-ish bounce from sky
                intensity={0.3}
            />
        </>
    );
}
