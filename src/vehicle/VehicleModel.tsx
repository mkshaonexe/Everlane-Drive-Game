import { useRef } from 'react';
import { Group } from 'three';

export function VehicleModel() {
    const groupRef = useRef<Group>(null);

    // Simple Cybertruck-esque shape
    // Body dimensions: ~4.5m long, ~2m wide, ~1.5m high

    return (
        <group ref={groupRef}>
            {/* Main Body Chassis */}
            <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                <boxGeometry args={[2, 0.8, 4.5]} />
                <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.6} />
            </mesh>

            {/* Cabin / Windows */}
            <mesh position={[0, 1.4, -0.2]}>
                <boxGeometry args={[1.8, 0.6, 2.5]} />
                <meshStandardMaterial color="#111111" roughness={0.2} metalness={0.8} transparent opacity={0.9} />
            </mesh>

            {/* Wheels */}
            {/* Front Left */}
            <mesh position={[-1.1, 0.4, -1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
                <meshStandardMaterial color="#111111" roughness={0.9} />
            </mesh>
            {/* Front Right */}
            <mesh position={[1.1, 0.4, -1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
                <meshStandardMaterial color="#111111" roughness={0.9} />
            </mesh>
            {/* Rear Left */}
            <mesh position={[-1.1, 0.4, 1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
                <meshStandardMaterial color="#111111" roughness={0.9} />
            </mesh>
            {/* Rear Right */}
            <mesh position={[1.1, 0.4, 1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
                <meshStandardMaterial color="#111111" roughness={0.9} />
            </mesh>

            {/* Headlights */}
            <mesh position={[-0.6, 0.8, -2.26]}>
                <boxGeometry args={[0.4, 0.1, 0.1]} />
                <meshStandardMaterial color="#ccffcc" emissive="#ccffcc" emissiveIntensity={2} />
            </mesh>
            <mesh position={[0.6, 0.8, -2.26]}>
                <boxGeometry args={[0.4, 0.1, 0.1]} />
                <meshStandardMaterial color="#ccffcc" emissive="#ccffcc" emissiveIntensity={2} />
            </mesh>

            {/* Taillights */}
            <mesh position={[0, 0.9, 2.26]}>
                <boxGeometry args={[1.6, 0.1, 0.1]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
            </mesh>
        </group>
    );
}
