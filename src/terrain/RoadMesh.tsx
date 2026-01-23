import { useMemo } from 'react';
import { CatmullRomCurve3, DoubleSide, BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';

interface RoadMeshProps {
    path: CatmullRomCurve3;
    width?: number;
}

export const RoadMesh = ({ path, width = 10 }: RoadMeshProps) => {
    const geometry = useMemo(() => {
        const segments = 200;
        const positions: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        const up = new Vector3(0, 1, 0);

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = path.getPointAt(t);
            const tangent = path.getTangentAt(t).normalize();

            // Perpendicular vector for road width
            const right = new Vector3().crossVectors(tangent, up).normalize();

            const leftPt = point.clone().add(right.clone().multiplyScalar(-width / 2));
            const rightPt = point.clone().add(right.clone().multiplyScalar(width / 2));

            // Vertices
            positions.push(leftPt.x, leftPt.y + 0.05, leftPt.z); // Slightly above terrain to avoid Z-fighting
            positions.push(rightPt.x, rightPt.y + 0.05, rightPt.z);

            // UVs (repeat along length)
            uvs.push(0, t * segments * 0.1);
            uvs.push(1, t * segments * 0.1);

            // Indices
            if (i < segments) {
                const base = i * 2;
                indices.push(base, base + 1, base + 2);
                indices.push(base + 1, base + 3, base + 2);
            }
        }

        const geo = new BufferGeometry();
        geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
        geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        return geo;
    }, [path, width]);

    return (
        <mesh receiveShadow castShadow userData={{ isRoad: true }}>
            <primitive object={geometry} attach="geometry" />
            <meshStandardMaterial
                color="#222"
                roughness={0.8}
                side={DoubleSide}
            />
        </mesh>
    );
};
