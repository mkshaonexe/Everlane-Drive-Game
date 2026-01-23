
import { useEffect, useRef, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { EffectComposer as ThreeEffectComposer } from 'three-stdlib';
import { RenderPass } from 'three-stdlib';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

export function PostProcessing() {
    const { gl, scene, camera, size } = useThree();
    const composerRef = useRef<ThreeEffectComposer | null>(null);

    // Create composer only once, update passes on resize
    useMemo(() => {
        const composer = new ThreeEffectComposer(gl);
        composer.addPass(new RenderPass(scene, camera));

        // UnrealBloomPass parameters: resolution, strength, radius, threshold
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(size.width, size.height),
            0.3,  // strength - reduced for subtlety
            0.4,  // radius
            0.85  // threshold
        );
        composer.addPass(bloomPass);

        composerRef.current = composer;

        return composer;
    }, [gl, scene, camera]);

    // Handle resize
    useEffect(() => {
        if (composerRef.current) {
            composerRef.current.setSize(size.width, size.height);
        }
    }, [size]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (composerRef.current) {
                composerRef.current.dispose();
            }
        };
    }, []);

    // Take over rendering - this is CRITICAL!
    useFrame(() => {
        if (composerRef.current) {
            composerRef.current.render();
        }
    }, 1);

    return null;
}
