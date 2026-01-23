import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { DirectionalLight } from 'three';

interface LightingProps {
    dayCycleDuration?: number; // Duration of a full day in seconds
}

export function Lighting({ dayCycleDuration = 600 }: LightingProps) {
    const sunRef = useRef<DirectionalLight>(null);
    const [time, setTime] = useState(0);

    useFrame((_, delta) => {
        // Update time
        const newTime = (time + delta) % dayCycleDuration;
        setTime(newTime);

        if (sunRef.current) {
            // Calculate sun position based on time
            // 0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight
            const progress = newTime / dayCycleDuration;
            const angle = progress * Math.PI * 2 - Math.PI / 2; // Start at -PI/2 (sunriseish)

            // Orbit around Z axis (East-West)
            const radius = 100;
            sunRef.current.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                50 // Offset in Z to have some angle
            );

            // Change color/intensity based on height
            // Simple logic:
            // High: White, High Intensity
            // Low: Orange/Red, Low Intensity
            // Negative: Off/Moon logic (simplified to keeping sun dim)

            const heigth = Math.sin(angle);
            if (heigth > 0) {
                // Day
                sunRef.current.intensity = 1.5;
                sunRef.current.color.setHSL(0.1, 0.1, 0.5 + heigth * 0.5); // Whitens as it goes up
            } else {
                // Night
                sunRef.current.intensity = 0.1;
                sunRef.current.color.setHex(0x111122); // Blueish moon
            }
        }
    });

    return (
        <>
            <ambientLight intensity={0.4} />
            <directionalLight
                ref={sunRef}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-100}
                shadow-camera-right={100}
                shadow-camera-top={100}
                shadow-camera-bottom={-100}
            />
            {/* Skybox could go here or separate component */}
        </>
    );
}
