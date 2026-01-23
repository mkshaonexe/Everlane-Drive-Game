import { useMemo } from 'react';
import { CatmullRomCurve3, DoubleSide, BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
import { mergeBufferGeometries } from 'three-stdlib';

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
            positions.push(leftPt.x, leftPt.y + 0.15, leftPt.z); // Increased offset to avoid Z-fighting
            positions.push(rightPt.x, rightPt.y + 0.15, rightPt.z);

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

    // Lane markings geometry (Solid Mesh)
    const laneMarkingsGeometry = useMemo(() => {
        const segments = 400; // Higher resolution for smooth curves
        const up = new Vector3(0, 1, 0);
        const geometries: BufferGeometry[] = [];

        // Center dashed line
        const dashLength = 3;
        const gapLength = 6;
        const lineWidth = 0.2;

        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const tNext = (i + 1) / segments;

            // Distance along road to check dash pattern
            const distance = t * path.getLength();
            const cycleLength = dashLength + gapLength;
            const posInCycle = distance % cycleLength;

            // Simple dashed line logic: One segment per step if within dash
            // A better way is to generate quads following the path.
            // Let's generate a continuous strip for dashes

            // Check if start of this segment is within a dash
            if (posInCycle < dashLength) {
                const p1 = path.getPointAt(t);
                const p2 = path.getPointAt(tNext);
                const tangent = path.getTangentAt(t).normalize();
                const right = new Vector3().crossVectors(tangent, up).normalize();

                // Create a quad for this segment of the dash
                // Offset slightly higher than road
                const yOffset = 0.18;

                // 4 Corners of the segment
                const l1 = p1.clone().add(right.clone().multiplyScalar(-lineWidth / 2));
                const r1 = p1.clone().add(right.clone().multiplyScalar(lineWidth / 2));
                const l2 = p2.clone().add(right.clone().multiplyScalar(-lineWidth / 2));
                const r2 = p2.clone().add(right.clone().multiplyScalar(lineWidth / 2));

                const pts = [
                    l1.x, l1.y + yOffset, l1.z,
                    r1.x, r1.y + yOffset, r1.z,
                    l2.x, l2.y + yOffset, l2.z,
                    r2.x, r2.y + yOffset, r2.z
                ];

                const geo = new BufferGeometry();
                geo.setAttribute('position', new Float32BufferAttribute(pts, 3));
                geo.setIndex([0, 2, 1, 1, 2, 3]);
                geometries.push(geo);
            }
        }

        // Edge lines (Solid)
        const edgeWidth = 0.15;
        const yOffsetEdge = 0.18;

        // Continuous strips for edges
        const leftEdgeGeo = new BufferGeometry();
        const rightEdgeGeo = new BufferGeometry();

        const leftPositions: number[] = [];
        const rightPositions: number[] = [];
        const edgeIndices: number[] = [];

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const p = path.getPointAt(t);
            const tangent = path.getTangentAt(t).normalize();
            const right = new Vector3().crossVectors(tangent, up).normalize();

            // Left Edge
            const centerL = p.clone().add(right.clone().multiplyScalar(-width / 2 + 0.3));
            const l1 = centerL.clone().add(right.clone().multiplyScalar(-edgeWidth / 2));
            const r1 = centerL.clone().add(right.clone().multiplyScalar(edgeWidth / 2));

            // Right Edge
            const centerR = p.clone().add(right.clone().multiplyScalar(width / 2 - 0.3));
            const l2 = centerR.clone().add(right.clone().multiplyScalar(-edgeWidth / 2));
            const r2 = centerR.clone().add(right.clone().multiplyScalar(edgeWidth / 2));

            leftPositions.push(l1.x, l1.y + yOffsetEdge, l1.z, r1.x, r1.y + yOffsetEdge, r1.z);
            rightPositions.push(l2.x, l2.y + yOffsetEdge, l2.z, r2.x, r2.y + yOffsetEdge, r2.z);

            if (i < segments) {
                const base = i * 2;
                edgeIndices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
            }
        }

        leftEdgeGeo.setAttribute('position', new Float32BufferAttribute(leftPositions, 3));
        leftEdgeGeo.setIndex(edgeIndices);

        rightEdgeGeo.setAttribute('position', new Float32BufferAttribute(rightPositions, 3));
        rightEdgeGeo.setIndex(edgeIndices);

        geometries.push(leftEdgeGeo, rightEdgeGeo);

        // Merge all line geometries
        if (geometries.length > 0) {
            const merged = mergeBufferGeometries(geometries);
            return merged || new BufferGeometry();
        }
        return new BufferGeometry();
    }, [path, width]);

    return (
        <group>
            {/* Road surface */}
            <mesh receiveShadow castShadow userData={{ isRoad: true }}>
                <primitive object={roadGeometry} attach="geometry" />
                <meshStandardMaterial
                    color="#3a3a40" // Medium gray asphalt matching reference images
                    roughness={0.85} // Matte but not completely rough
                    metalness={0.05}
                    side={DoubleSide}
                />
            </mesh>

            {/* Lane markings Mesh */}
            <mesh castShadow receiveShadow>
                <primitive object={laneMarkingsGeometry} attach="geometry" />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#aaaaaa"
                    emissiveIntensity={0.2}
                    roughness={0.5}
                    metalness={0.0}
                    side={DoubleSide}
                />
            </mesh>
        </group>
    );
};
