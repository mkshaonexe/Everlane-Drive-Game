import { useMemo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGameStore, MAPS } from '../stores/gameStore';
import { getAssetPath } from '../utils/paths';
import { Group } from 'three';

interface GLTFMapModelProps {
    path: string;
    scale?: number;
    rotation?: [number, number, number];
    position?: [number, number, number];
}

function GLTFMapModel({ path, scale = 1, rotation = [0, 0, 0], position = [0, 0, 0] }: GLTFMapModelProps) {
    const { scene } = useGLTF(getAssetPath(path));
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    return (
        <primitive
            object={clonedScene}
            scale={scale}
            rotation={rotation}
            position={position}
        />
    );
}

function MapLoadingPlaceholder() {
    return (
        <mesh>
            <boxGeometry args={[100, 1, 100]} />
            <meshStandardMaterial color="#3a5a3a" wireframe />
        </mesh>
    );
}

interface GLTFMapProps {
    terrainGroupRef: React.RefObject<Group | null>;
}

export function GLTFMap({ terrainGroupRef }: GLTFMapProps) {
    const selectedMap = useGameStore(state => state.selectedMap);
    const mapConfig = useMemo(() => MAPS.find(m => m.id === selectedMap), [selectedMap]);

    if (!mapConfig || mapConfig.type !== 'gltf' || !mapConfig.path) {
        return null;
    }

    return (
        <group ref={terrainGroupRef}>
            {/* Huge collidable grass field catching the car if it falls off-road */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 25, 0]}
                receiveShadow
            >
                <planeGeometry args={[15000, 15000]} />
                <meshStandardMaterial
                    color="#5c7a42" // Natural Tuscan green grass
                    roughness={0.9}
                    metalness={0.1}
                />
            </mesh>

            <Suspense fallback={<MapLoadingPlaceholder />}>
                <GLTFMapModel
                    path={mapConfig.path}
                    scale={mapConfig.scale}
                    rotation={mapConfig.rotationOffset}
                    position={mapConfig.positionOffset}
                />
            </Suspense>
        </group>
    );
}
