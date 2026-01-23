
import { useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { EffectComposer } from 'three-stdlib';
import { RenderPass } from 'three-stdlib';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

export function PostProcessing() {
    const { gl, scene, camera, size } = useThree();

    useEffect(() => {
        const composer = new EffectComposer(gl);
        composer.addPass(new RenderPass(scene, camera));

        // UnrealBloomPass parameters: resolution, strength, radius, threshold
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(size.width, size.height),
            0.5,  // strength
            0.4,  // radius
            0.85  // threshold
        );
        composer.addPass(bloomPass);

        return () => {
            composer.dispose();
        };
    }, [gl, scene, camera, size]);

    useFrame(() => {
        // We don't strictly need to render here if we just replace the render loop,
        // but typically with R3F + custom composer, we take over rendering.
        // simpler method: use useFrame to render composer
    }, 1);

    return null;
}


