import { useMemo } from 'react';
import { CatmullRomCurve3, DoubleSide } from 'three';

interface RoadMeshProps {
    path: CatmullRomCurve3;
}

export const RoadMesh = ({ path }: RoadMeshProps) => {
    const geometry = useMemo(() => {
        // 64 segments, 8 radius (width), 8 radial segments, closed false
        return <tubeGeometry args={[path, 64, 4, 8, false]} />;
    }, [path]);

    return (
        <mesh receiveShadow castShadow position={[0, 0.1, 0]}>
            {geometry}
            <meshStandardMaterial color="#333" roughness={0.6} side={DoubleSide} />
        </mesh>
    );
};
