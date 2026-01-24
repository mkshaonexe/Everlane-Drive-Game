import { useMemo, useRef, Suspense } from 'react';
import { Group, Shape, ExtrudeGeometry, MeshPhysicalMaterial, Color } from 'three';
import { useGLTF } from '@react-three/drei';
import { useGameStore, VEHICLES } from '../stores/gameStore';

export function VehicleModel({ vehicleId }: { vehicleId?: string }) {
    const groupRef = useRef<Group>(null);
    const storeSelectedVehicle = useGameStore(state => state.selectedVehicle);
    const textId = vehicleId || storeSelectedVehicle;

    // Find config
    const config = useMemo(() => VEHICLES.find(v => v.id === textId) || VEHICLES[0], [textId]);

    // --- GLTF Loading ---
    if (config.type === 'gltf' && config.path) {
        return (
            <group ref={groupRef} rotation-y={Math.PI / 2}>
                {/* Main Shadow Plane */}
                <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[5, 2.4]} />
                    <meshBasicMaterial
                        color="#000000"
                        transparent
                        opacity={0.3}
                        depthWrite={false}
                    />
                </mesh>
                <Suspense fallback={null}>
                    <GLTFVehicle path={config.path} scale={config.scale} rotation={config.rotationOffset} position={config.positionOffset} />
                </Suspense>
            </group>
        );
    }

    // --- Procedural Fallback (Standard) ---
    return <ProceduralVehicle id={textId} />;
}

// Extracted to avoid conditional hooks
function ProceduralVehicle({ id }: { id: string }) {
    const groupRef = useRef<Group>(null);

    // --- Materials ---
    const materials = useMemo(() => {
        let paintColor = '#1c4bc9'; // Default Blue

        switch (id) {
            case 'sport': paintColor = '#ff3333'; break; // Red
            case 'offroad': paintColor = '#33cc33'; break; // Green
            case 'bus': paintColor = '#ffd000'; break; // Yellow
            default: paintColor = '#1c4bc9';
        }

        const paint = new MeshPhysicalMaterial({
            color: new Color(paintColor),
            metalness: 0.6,
            roughness: 0.2,
            clearcoat: 1.0,
            clearcoatRoughness: 0.03,
            reflectivity: 1.0,
            envMapIntensity: 2.0
        });

        const glass = new MeshPhysicalMaterial({
            color: new Color('#111111'),
            metalness: 0.9,
            roughness: 0.05,
            transmission: 0.2, // Slight transparency
            thickness: 0.5,
            envMapIntensity: 3.0,
            transparent: true,
            opacity: 0.7
        });

        const rubber = new MeshPhysicalMaterial({
            color: new Color('#1a1a1a'),
            roughness: 0.9,
            metalness: 0.1,
            clearcoat: 0.0,
            envMapIntensity: 0.2
        });

        const alloy = new MeshPhysicalMaterial({
            color: new Color('#eeeeee'),
            metalness: 0.9,
            roughness: 0.2,
            clearcoat: 0.5,
            envMapIntensity: 2.0
        });

        const blackPlastic = new MeshPhysicalMaterial({
            color: new Color('#111111'),
            roughness: 0.6,
            metalness: 0.3
        });

        const emissionHeadlight = new MeshPhysicalMaterial({
            color: new Color('#ccffff'),
            emissive: new Color('#ccffff'),
            emissiveIntensity: 10,
            toneMapped: false
        });

        const emissionTaillight = new MeshPhysicalMaterial({
            color: new Color('#ff0000'),
            emissive: new Color('#ff0000'),
            emissiveIntensity: 5,
            toneMapped: false
        });

        return { paint, glass, rubber, alloy, blackPlastic, emissionHeadlight, emissionTaillight };
    }, [id]);

    // --- Geometries ---
    const { bodyGeometry, glassGeometry } = useMemo(() => {

        // 1. Main Body Shape
        // Defined in X/Y plane. Facing +X.
        // Y=0 is ground level in Shape coords to match mesh position.
        // Let's use: Y=0.4 is bottom of chassis. 
        const chassisY = 0.4;

        const bodyShape = new Shape();
        bodyShape.moveTo(2.3, chassisY);        // Front Bottom
        bodyShape.lineTo(2.35, 0.75);           // Front Bumper Vert
        bodyShape.quadraticCurveTo(2.3, 0.85, 1.8, 0.9); // Nose to Hood transition
        bodyShape.lineTo(0.6, 1.0);             // Windshield Base
        bodyShape.lineTo(-1.0, 1.0);            // Roof Line
        bodyShape.lineTo(-1.8, 0.95);           // Rear Window Base
        bodyShape.lineTo(-2.2, 0.85);           // Trunk Top
        bodyShape.lineTo(-2.25, chassisY + 0.1); // Rear Bumper Vertical
        bodyShape.lineTo(2.3, chassisY);        // Close bottom

        const bodyExtrudeSettings = {
            steps: 1,
            depth: 1.8, // Total Width
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 3
        };

        const bodyGeo = new ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
        // Translate Z to center the car width
        bodyGeo.translate(0, 0, -bodyExtrudeSettings.depth / 2);

        // 2. Cabin/Glass Shape
        const cabinShape = new Shape();
        cabinShape.moveTo(0.7, 1.0);   // Front
        cabinShape.lineTo(-0.2, 1.45); // Top Peak
        cabinShape.lineTo(-1.4, 0.95); // Rear
        cabinShape.lineTo(0.7, 1.0);   // Close

        const cabinGeo = new ExtrudeGeometry(cabinShape, {
            steps: 1,
            depth: 1.5,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 2
        });
        cabinGeo.translate(0, 0, -1.5 / 2);

        return {
            bodyGeometry: bodyGeo,
            glassGeometry: cabinGeo
        };
    }, []);

    const wheelRadius = 0.34;
    const wheelWidth = 0.28;
    const frontAxleX = 1.5;
    const rearAxleX = -1.5;

    const Wheel = ({ x, z, left }: { x: number, z: number, left: boolean }) => (
        <group position={[x, wheelRadius, z]}>
            <group rotation={[left ? 0 : Math.PI, 0, 0]}>
                {/* Tire */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 32]} />
                    <primitive object={materials.rubber} attach="material" />
                </mesh>
                {/* Rim */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth + 0.01, 16]} />
                    <primitive object={materials.alloy} attach="material" />
                </mesh>
                {/* Wheel Cap */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, left ? 0.15 : -0.15]}>
                    <cylinderGeometry args={[wheelRadius * 0.2, wheelRadius * 0.2, 0.05, 8]} />
                    <primitive object={materials.blackPlastic} attach="material" />
                </mesh>
            </group>
        </group>
    );

    return (
        <group ref={groupRef} rotation-y={Math.PI / 2}>
            {/* Main Shadow Plane */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[5, 2.4]} />
                <meshBasicMaterial
                    color="#000000"
                    transparent
                    opacity={0.3}
                    depthWrite={false}
                />
            </mesh>

            {/* --- Body Group --- */}
            {/* Position Y=0. This respects the Shape's Y coordinates. */}
            <group position={[0, 0, 0]}>

                {/* Main Body Chassis */}
                <mesh geometry={bodyGeometry} castShadow receiveShadow>
                    <primitive object={materials.paint} attach="material" />
                </mesh>

                {/* Cabin Glass */}
                <mesh position={[0.0, 0.02, 0]} geometry={glassGeometry}>
                    <primitive object={materials.glass} attach="material" />
                </mesh>

                {/* Details positioned relative to Shape coordinates */}

                {/* Hood Scoop */}
                <mesh position={[1.0, 0.92, 0]}>
                    <boxGeometry args={[0.8, 0.05, 1.2]} />
                    <primitive object={materials.paint} attach="material" />
                </mesh>

                {/* Front Grille */}
                <mesh position={[2.35, 0.55, 0]}>
                    <boxGeometry args={[0.05, 0.25, 1.4]} />
                    <primitive object={materials.blackPlastic} attach="material" />
                </mesh>

                {/* Headlights */}
                <mesh position={[2.32, 0.7, -0.6]} rotation={[0, 0.1, 0]}>
                    <boxGeometry args={[0.1, 0.1, 0.4]} />
                    <primitive object={materials.emissionHeadlight} attach="material" />
                </mesh>
                <mesh position={[2.32, 0.7, 0.6]} rotation={[0, -0.1, 0]}>
                    <boxGeometry args={[0.1, 0.1, 0.4]} />
                    <primitive object={materials.emissionHeadlight} attach="material" />
                </mesh>

                {/* Taillight Strip */}
                <mesh position={[-2.26, 0.8, 0]}>
                    <boxGeometry args={[0.05, 0.12, 1.7]} />
                    <primitive object={materials.emissionTaillight} attach="material" />
                </mesh>

                {/* Spoiler */}
                <group position={[-2.0, 0.95, 0]}>
                    {/* Wing */}
                    <mesh position={[0, 0.2, 0]}>
                        <boxGeometry args={[0.5, 0.05, 2.0]} />
                        <primitive object={materials.paint} attach="material" />
                    </mesh>
                    {/* Supports */}
                    <mesh position={[0, 0, -0.6]} rotation={[0.2, 0, 0]}>
                        <boxGeometry args={[0.3, 0.3, 0.05]} />
                        <primitive object={materials.blackPlastic} attach="material" />
                    </mesh>
                    <mesh position={[0, 0, 0.6]} rotation={[0.2, 0, 0]}>
                        <boxGeometry args={[0.3, 0.3, 0.05]} />
                        <primitive object={materials.blackPlastic} attach="material" />
                    </mesh>
                </group>

                {/* Wheel Arches / Fenders */}
                <mesh position={[frontAxleX, 0.6, 0.9]}>
                    <boxGeometry args={[0.9, 0.35, 0.15]} />
                    <primitive object={materials.paint} attach="material" />
                </mesh>
                <mesh position={[frontAxleX, 0.6, -0.9]}>
                    <boxGeometry args={[0.9, 0.35, 0.15]} />
                    <primitive object={materials.paint} attach="material" />
                </mesh>
                <mesh position={[rearAxleX, 0.6, 0.9]}>
                    <boxGeometry args={[0.9, 0.35, 0.15]} />
                    <primitive object={materials.paint} attach="material" />
                </mesh>
                <mesh position={[rearAxleX, 0.6, -0.9]}>
                    <boxGeometry args={[0.9, 0.35, 0.15]} />
                    <primitive object={materials.paint} attach="material" />
                </mesh>
            </group>

            {/* --- Wheels --- */}
            <Wheel x={frontAxleX} z={-1.05} left={false} />
            <Wheel x={frontAxleX} z={1.05} left={true} />
            <Wheel x={rearAxleX} z={-1.05} left={false} />
            <Wheel x={rearAxleX} z={1.05} left={true} />

        </group>
    );
}

function GLTFVehicle({ path, scale = 1, rotation = [0, 0, 0], position = [0, 0, 0] }: { path: string, scale?: number, rotation?: number[], position?: number[] }) {
    const { scene } = useGLTF(path);
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    return <primitive
        object={clonedScene}
        scale={scale}
        rotation={rotation}
        position={position}
    />;
}
