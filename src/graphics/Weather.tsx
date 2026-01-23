import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { FogExp2, Color } from 'three';

interface WeatherProps {
    fogDensity?: number;
    fogColor?: string;
}

export function Weather({ fogDensity = 0.005, fogColor = '#88a4bc' }: WeatherProps) {
    const { scene } = useThree();

    useEffect(() => {
        const oldFog = scene.fog;
        scene.fog = new FogExp2(fogColor, fogDensity);
        scene.background = new Color(fogColor);

        return () => {
            scene.fog = oldFog;
            scene.background = null;
        };
    }, [fogDensity, fogColor, scene]);

    return null;
}
