import { useMemo } from 'react';
import { CatmullRomCurve3, DoubleSide, BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';

interface RoadMeshProps {
    path: CatmullRomCurve3;
    width?: number;
}

export const RoadMesh = ({ path, width = 10 }: RoadMeshProps) => {
    const roadGeometry = useMemo(() => {
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

    // Lane markings geometry
    const laneMarkingsGeometry = useMemo(() => {
        const segments = 200;
        const positions: number[] = [];
        const up = new Vector3(0, 1, 0);

        // Center dashed line
        const dashLength = 3; // 3m dashes
        const gapLength = 6; // 6m gaps
        const lineWidth = 0.15; // 15cm wide

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = path.getPointAt(t);
            const tangent = path.getTangentAt(t).normalize();
            const right = new Vector3().crossVectors(tangent, up).normalize();

            // Distance along road
            const distance = t * path.getLength();
            const cycleLength = dashLength + gapLength;
            const posInCycle = distance % cycleLength;

            // Only draw during dash portion
            if (posInCycle < dashLength) {
                // Center line
                const center = point.clone();
                const leftDash = center.clone().add(right.clone().multiplyScalar(-lineWidth / 2));
                const rightDash = center.clone().add(right.clone().multiplyScalar(lineWidth / 2));

                positions.push(leftDash.x, leftDash.y + 0.06, leftDash.z);
                positions.push(rightDash.x, rightDash.y + 0.06, rightDash.z);
            }

            // Edge lines (solid, narrower)
            const edgeWidth = 0.1; // 10cm wide

            // Left edge
            const leftEdgeCenter = point.clone().add(right.clone().multiplyScalar(-width / 2 + 0.3));
            const leftEdgeLeft = leftEdgeCenter.clone().add(right.clone().multiplyScalar(-edgeWidth / 2));
            const leftEdgeRight = leftEdgeCenter.clone().add(right.clone().multiplyScalar(edgeWidth / 2));

            positions.push(leftEdgeLeft.x, leftEdgeLeft.y + 0.06, leftEdgeLeft.z);
            positions.push(leftEdgeRight.x, leftEdgeRight.y + 0.06, leftEdgeRight.z);

            // Right edge
            const rightEdgeCenter = point.clone().add(right.clone().multiplyScalar(width / 2 - 0.3));
            const rightEdgeLeft = rightEdgeCenter.clone().add(right.clone().multiplyScalar(-edgeWidth / 2));
            const rightEdgeRight = rightEdgeCenter.clone().add(right.clone().multiplyScalar(edgeWidth / 2));

            positions.push(rightEdgeLeft.x, rightEdgeLeft.y + 0.06, rightEdgeLeft.z);
            positions.push(rightEdgeRight.x, rightEdgeRight.y + 0.06, rightEdgeRight.z);
        }

        const geo = new BufferGeometry();
        geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
        return geo;
    }, [path, width]);

    return (
        <group>
            {/* Road surface */}
            <mesh receiveShadow castShadow userData={{ isRoad: true }}>
                <primitive object={roadGeometry} attach="geometry" />
                <meshStandardMaterial
                    color="#1a1a1a" // Dark asphalt
                    roughness={0.9} // Very rough/matte
                    metalness={0.1}
                    side={DoubleSide}
                />
            </mesh>

            {/* Lane markings */}
            <points>
                <primitive object={laneMarkingsGeometry} attach="geometry" />
                <pointsMaterial
                    color="#f0f0f0" // Brighter white markings
                    size={0.2}
                    sizeAttenuation={true}
                />
            </points>
        </group>
    );
};
