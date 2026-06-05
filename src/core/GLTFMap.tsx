import { useMemo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGameStore, MAPS } from '../stores/gameStore';

interface GLTFMapProps {
    path: string;
    scale?: number;
    rotation?: [number, number, number];
    position?: [number, number, number];
}

function GLTFMapModel({ path, scale = 1, rotation = [0, 0, 0], position = [0, 0, 0] }: GLTFMapProps) {
    const { scene } = useGLTF(path);
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

export function GLTFMap() {
    const selectedMap = useGameStore(state => state.selectedMap);
    const mapConfig = useMemo(() => MAPS.find(m => m.id === selectedMap), [selectedMap]);

    if (!mapConfig || mapConfig.type !== 'gltf' || !mapConfig.path) {
        return null;
    }

    return (
        <Suspense fallback={<MapLoadingPlaceholder />}>
            <GLTFMapModel
                path={mapConfig.path}
                scale={mapConfig.scale}
                rotation={mapConfig.rotationOffset}
                position={mapConfig.positionOffset}
            />
        </Suspense>
    );
}
