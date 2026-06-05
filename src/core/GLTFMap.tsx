import { useMemo, Suspense, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGameStore, MAPS } from '../stores/gameStore';
import { getAssetPath } from '../utils/paths';
import { Group, Vector3 } from 'three';

interface GLTFMapModelProps {
    path: string;
    scale?: number;
    rotation?: [number, number, number];
    position?: [number, number, number];
}

function GLTFMapModel({ path, scale = 1, rotation = [0, 0, 0], position = [0, 0, 0] }: GLTFMapModelProps) {
    const { scene } = useGLTF(getAssetPath(path));
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    useEffect(() => {
        if (!clonedScene) return;

        // Apply transforms to clonedScene to compute matrixWorld correctly
        clonedScene.scale.set(scale, scale, scale);
        if (rotation) clonedScene.rotation.fromArray(rotation);
        if (position) clonedScene.position.fromArray(position);
        clonedScene.updateMatrixWorld(true);

        const points: Vector3[] = [];
        
        // Traverse and extract vertices
        clonedScene.traverse((child: any) => {
            if (child.isMesh) {
                // Flag mesh as road for physics ground check
                child.userData.isRoad = true;
                
                const geometry = child.geometry;
                if (!geometry) return;
                const positionAttr = geometry.attributes.position;
                if (!positionAttr) return;

                const count = positionAttr.count;
                // Target ~150 points per mesh to keep total points around 3000-5000
                const step = Math.max(1, Math.floor(count / 150));

                geometry.computeBoundingBox();
                const bbox = geometry.boundingBox;
                if (bbox) {
                    const sizeX = bbox.max.x - bbox.min.x;
                    const sizeY = bbox.max.y - bbox.min.y;
                    const sizeZ = bbox.max.z - bbox.min.z;
                    
                    const name = child.name.toLowerCase();
                    const isExcluded = name.includes('building') || name.includes('wall') || name.includes('house') || name.includes('barrier') || name.includes('prop') || name.includes('chevron') || name.includes('tree') || name.includes('light') || name.includes('sign') || name.includes('pole') || name.includes('sky');
                    
                    // A flat mesh has small Y height compared to horizontal size
                    const isFlat = sizeY < 15.0 && (sizeX > 5.0 || sizeZ > 5.0);
                    
                    if (!isExcluded && isFlat) {
                        const tempV = new Vector3();
                        for (let i = 0; i < count; i += step) {
                            tempV.set(
                                positionAttr.getX(i),
                                positionAttr.getY(i),
                                positionAttr.getZ(i)
                            );
                            tempV.applyMatrix4(child.matrixWorld);
                            points.push(new Vector3(tempV.x, tempV.y, tempV.z));
                        }
                    }
                }
            }
        });

        console.log(`Extracted ${points.length} road map points from GLTF`);
        useGameStore.getState().setRoadPath(points);

    }, [clonedScene, scale, rotation, position]);

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
                position={[0, 10, 0]}
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
