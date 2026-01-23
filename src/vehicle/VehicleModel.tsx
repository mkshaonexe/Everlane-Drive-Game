import { useMemo, useRef } from 'react';
import { Group, Shape, ExtrudeGeometry } from 'three';

export function VehicleModel() {
    const groupRef = useRef<Group>(null);

    // Create the aerodynamic side profile of the car
    const { bodyGeometry, glassGeometry } = useMemo(() => {
        // Car Body Shape (Side profile facing +X)
        const bodyShape = new Shape();
        bodyShape.moveTo(2.2, 0.5); // Nose bottom
        bodyShape.lineTo(2.3, 0.8); // Nose tip
        bodyShape.lineTo(1.2, 1.0); // Hood start
        bodyShape.lineTo(0.5, 1.35); // Windshield base
        bodyShape.lineTo(-0.8, 1.4); // Roof peak
        bodyShape.lineTo(-1.6, 1.25); // Rear window top
        bodyShape.lineTo(-2.0, 0.9); // Trunk deck
        bodyShape.lineTo(-2.1, 0.6); // Rear bumper top
        bodyShape.lineTo(-2.0, 0.4); // Rear bumper bottom
        bodyShape.lineTo(2.0, 0.4); // Chassis bottom
        bodyShape.quadraticCurveTo(2.1, 0.4, 2.2, 0.5); // Smooth nose curve

        // Extrude settings for the main body
        const extrudeSettings = {
            steps: 1,
            depth: 1.8, // Car width
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 4
        };

        // Glass/Cabin Shape (Slightly inset)
        const glassShape = new Shape();
        glassShape.moveTo(0.5, 1.35);
        glassShape.lineTo(-0.8, 1.4);
        glassShape.lineTo(-1.6, 1.25);
        glassShape.lineTo(-0.5, 1.35); // Close loop roughly

        // Generate geometries
        const bodyGeo = new ExtrudeGeometry(bodyShape, extrudeSettings);
        const glassGeo = new ExtrudeGeometry(glassShape, {
            ...extrudeSettings,
            depth: 1.6, // Slightly narrower than body
            bevelEnabled: false
        });

        // Center the geometries
        bodyGeo.center();
        glassGeo.center();

        return { bodyGeometry: bodyGeo, glassGeometry: glassGeo };
    }, []);

    const wheelRadius = 0.35;
    const wheelWidth = 0.25;

    return (
        <group ref={groupRef} rotation-y={Math.PI / 2}>
            {/* Fake Shadow Blob */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[2.5, 32]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.6} depthWrite={false} />
            </mesh>

            {/* Main Body */}
            <mesh position={[0, 0.7, 0]} castShadow receiveShadow geometry={bodyGeometry}>
                <meshStandardMaterial
                    color="#e0e0e0" // Slightly brighter white
                    roughness={0.2}
                    metalness={0.7}
                    envMapIntensity={2.0} // strong reflections
                />
            </mesh>

            {/* Cabin Glass (Visual overlay for windshield/windows) */}
            <mesh position={[0, 0.95, 0]} geometry={glassGeometry}>
                <meshStandardMaterial
                    color="#222"
                    roughness={0.0}
                    metalness={0.9}
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* Wheels */}
            {/* Front Left */}
            <mesh position={[1.4, wheelRadius, -0.75]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 32]} />
                <meshStandardMaterial color="#333333" roughness={0.7} />
                <mesh position={[0, -0.13, 0]} rotation={[0, 0, 0]}>
                    <cylinderGeometry args={[wheelRadius * 0.7, wheelRadius * 0.7, 0.05, 16]} />
                    <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
                </mesh>
            </mesh>
            {/* Front Right */}
            <mesh position={[1.4, wheelRadius, 0.75]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 32]} />
                <meshStandardMaterial color="#333333" roughness={0.7} />
                <mesh position={[0, 0.13, 0]} rotation={[0, 0, 0]}>
                    <cylinderGeometry args={[wheelRadius * 0.7, wheelRadius * 0.7, 0.05, 16]} />
                    <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
                </mesh>
            </mesh>
            {/* Rear Left */}
            <mesh position={[-1.4, wheelRadius, -0.75]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 32]} />
                <meshStandardMaterial color="#333333" roughness={0.7} />
                <mesh position={[0, -0.13, 0]} rotation={[0, 0, 0]}>
                    <cylinderGeometry args={[wheelRadius * 0.7, wheelRadius * 0.7, 0.05, 16]} />
                    <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
                </mesh>
            </mesh>
            {/* Rear Right */}
            <mesh position={[-1.4, wheelRadius, 0.75]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 32]} />
                <meshStandardMaterial color="#333333" roughness={0.7} />
                <mesh position={[0, 0.13, 0]} rotation={[0, 0, 0]}>
                    <cylinderGeometry args={[wheelRadius * 0.7, wheelRadius * 0.7, 0.05, 16]} />
                    <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
                </mesh>
            </mesh>

            {/* Headlights */}
            <mesh position={[2.1, 0.8, -0.6]} rotation={[0, 0.2, 0]}>
                <boxGeometry args={[0.2, 0.1, 0.4]} />
                <meshStandardMaterial color="#ccffff" emissive="#ccffff" emissiveIntensity={5} />
            </mesh>
            <mesh position={[2.1, 0.8, 0.6]} rotation={[0, -0.2, 0]}>
                <boxGeometry args={[0.2, 0.1, 0.4]} />
                <meshStandardMaterial color="#ccffff" emissive="#ccffff" emissiveIntensity={5} />
            </mesh>

            {/* Taillight Strip */}
            <mesh position={[-2.05, 0.85, 0]}>
                <boxGeometry args={[0.1, 0.12, 1.6]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
            </mesh>

            {/* Spoiler */}
            <mesh position={[-1.9, 1.15, 0]}>
                <boxGeometry args={[0.4, 0.05, 1.6]} />
                <meshStandardMaterial color="#f0f0f0" roughness={0.2} metalness={0.6} />
                {/* Spoiler legs */}
                <mesh position={[0.1, -0.15, -0.5]}>
                    <boxGeometry args={[0.1, 0.3, 0.05]} />
                    <meshStandardMaterial color="#f0f0f0" />
                </mesh>
                <mesh position={[0.1, -0.15, 0.5]}>
                    <boxGeometry args={[0.1, 0.3, 0.05]} />
                    <meshStandardMaterial color="#f0f0f0" />
                </mesh>
            </mesh>
        </group>
    );
}
