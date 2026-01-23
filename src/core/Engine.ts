import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { PHYSICS_TIMESTEP, MAX_PHYSICS_SUBSTEPS } from '../utils/constants';

interface EngineProps {
    onPhysicsUpdate?: (deltaTime: number) => void;
    paused?: boolean;
}

export const Engine = ({ onPhysicsUpdate, paused = false }: EngineProps) => {
    const timeAccumulator = useRef(0);

    useFrame((state, delta) => {
        if (paused) return;

        // Clamp delta time to prevent spiral of death
        const frameTime = Math.min(delta, 0.1);
        timeAccumulator.current += frameTime;

        let substeps = 0;
        while (timeAccumulator.current >= PHYSICS_TIMESTEP && substeps < MAX_PHYSICS_SUBSTEPS) {
            if (onPhysicsUpdate) {
                onPhysicsUpdate(PHYSICS_TIMESTEP);
            }
            timeAccumulator.current -= PHYSICS_TIMESTEP;
            substeps++;
        }
    });

    return null;
};
