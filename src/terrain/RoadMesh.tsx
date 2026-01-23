import { useMemo } from 'react';
import { CatmullRomCurve3, DoubleSide, BufferGeometry, Float32BufferAttribute, Vector3, CanvasTexture, RepeatWrapping } from 'three';
import { mergeBufferGeometries } from 'three-stdlib';

interface RoadMeshProps {
    path: CatmullRomCurve3;
    width?: number;
}

export const RoadMesh = ({ path, width = 10 }: RoadMeshProps) => {
    // Generate Asphalt Noise Texture
    const asphaltTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = '#3a3a40';
            context.fillRect(0, 0, 512, 512);

            // Add Noise
            for (let i = 0; i < 50000; i++) {
                const x = Math.random() * 512;
                const y = Math.random() * 512;
                const opacity = Math.random() * 0.1;
                const v = Math.random();
                context.fillStyle = v > 0.5 ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`;
                context.fillRect(x, y, 2, 2);
            }
        }
        const texture = new CanvasTexture(canvas);
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.repeat.set(1, 10); // Stretch along road
        return texture;
    }, []);

    const roadGeometry = useMemo(() => {
        const segments = 200;
        const positions: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        const up = new Vector3(0, 1, 0);

        const shoulderWidth = 2.5;
        const shoulderDrop = 1.5;

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = path.getPointAt(t);
            const tangent = path.getTangentAt(t).normalize();

            // Perpendicular vector for road width
            const right = new Vector3().crossVectors(tangent, up).normalize();

            // Road surface points
            const leftPt = point.clone().add(right.clone().multiplyScalar(-width / 2));
            const rightPt = point.clone().add(right.clone().multiplyScalar(width / 2));

            // Shoulder points (grounding)
            const leftShoulder = leftPt.clone().add(right.clone().multiplyScalar(-shoulderWidth));
            leftShoulder.y -= shoulderDrop;

            const rightShoulder = rightPt.clone().add(right.clone().multiplyScalar(shoulderWidth));
            rightShoulder.y -= shoulderDrop;

            // Vertices order: LeftShoulder, LeftRoad, RightRoad, RightShoulder
            // Y offset slightly to avoid z-fighting with terrain if close
            const yOffset = 0.15;

            // 0: Left Shoulder
            positions.push(leftShoulder.x, leftShoulder.y + yOffset, leftShoulder.z);
            // 1: Left Edge
            positions.push(leftPt.x, leftPt.y + yOffset, leftPt.z);
            // 2: Right Edge
            positions.push(rightPt.x, rightPt.y + yOffset, rightPt.z);
            // 3: Right Shoulder
            positions.push(rightShoulder.x, rightShoulder.y + yOffset, rightShoulder.z);

            // UVs
            const v = t * segments * 0.05; // Tiling along length
            uvs.push(0, v); // Left Shoulder UV
            uvs.push(0.1, v); // Left Edge UV
            uvs.push(0.9, v); // Right Edge UV
            uvs.push(1, v); // Right Shoulder UV

            // Indices
            if (i < segments) {
                const base = i * 4;

                // Left Slope (Shoulder to Left Edge)
                // 0, 1, 4 (next 0), 5 (next 1)
                indices.push(base + 0, base + 4, base + 1);
                indices.push(base + 1, base + 4, base + 5);

                // Road Surface
                // 1, 2, 5, 6
                indices.push(base + 1, base + 5, base + 2);
                indices.push(base + 2, base + 5, base + 6);

                // Right Slope
                // 2, 3, 6, 7
                indices.push(base + 2, base + 6, base + 3);
                indices.push(base + 3, base + 6, base + 7);
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

            // Create geometry for dashes
            if (posInCycle < dashLength) {
                const p1 = path.getPointAt(t);
                const p2 = path.getPointAt(tNext);
                const tangent = path.getTangentAt(t).normalize();
                const right = new Vector3().crossVectors(tangent, up).normalize();

                const yOffset = 0.18;

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
                    map={asphaltTexture}
                    color="#888888" // Lighter base color for texture
                    roughness={0.9}
                    metalness={0.1}
                    side={DoubleSide}
                />
            </mesh>

            {/* Lane markings Mesh */}
            <mesh castShadow receiveShadow>
                <primitive object={laneMarkingsGeometry} attach="geometry" />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={0.5}
                    roughness={0.4}
                    metalness={0.1}
                    side={DoubleSide}
                />
            </mesh>
        </group>
    );
};

