import { useRef } from 'react';
import { Group } from 'three';

export function VehicleModel() {
    const groupRef = useRef<Group>(null);

    // Sleek white sports car matching reference image
    // Overall dimensions: ~4.2m long, ~1.8m wide, ~1.3m high

    return (
        <group ref={groupRef}>
            {/* Main Body - Lower chassis */}
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.8, 0.5, 4.2]} />
                <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.7} />
            </mesh>

            {/* Cabin/Roof - Aerodynamic shape */}
            <mesh position={[0, 1.15, -0.3]} castShadow>
                <boxGeometry args={[1.6, 0.55, 2.2]} />
                <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.7} />
            </mesh>

            {/* Hood slope (front) */}
            <mesh position={[0, 0.95, -1.8]} rotation={[-0.2, 0, 0]} castShadow>
                <boxGeometry args={[1.6, 0.3, 1]} />
                <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.7} />
            </mesh>

            {/* Windshield */}
            <mesh position={[0, 1.35, -0.8]} rotation={[-0.3, 0, 0]}>
                <boxGeometry args={[1.55, 0.65, 0.05]} />
                <meshStandardMaterial
                    color="#1a1a1a"
                    roughness={0.05}
                    metalness={0.95}
                    transparent
                    opacity={0.4}
                />
            </mesh>

            {/* Rear window */}
            <mesh position={[0, 1.25, 0.4]} rotation={[0.25, 0, 0]}>
                <boxGeometry args={[1.55, 0.5, 0.05]} />
                <meshStandardMaterial
                    color="#1a1a1a"
                    roughness={0.05}
                    metalness={0.95}
                    transparent
                    opacity={0.4}
                />
            </mesh>

            {/* Side windows (Left) */}
            <mesh position={[-0.82, 1.15, -0.3]} rotation={[0, 0, 0.05]}>
                <boxGeometry args={[0.05, 0.5, 1.8]} />
                <meshStandardMaterial
                    color="#1a1a1a"
                    transparent
                    opacity={0.4}
                />
            </mesh>

            {/* Side windows (Right) */}
            <mesh position={[0.82, 1.15, -0.3]} rotation={[0, 0, -0.05]}>
                <boxGeometry args={[0.05, 0.5, 1.8]} />
                <meshStandardMaterial
                    color="#1a1a1a"
                    transparent
                    opacity={0.4}
                />
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

            {/* Headlights (white/LED style) */}
            <mesh position={[-0.6, 0.75, -2.11]}>
                <boxGeometry args={[0.35, 0.15, 0.05]} />
                <meshStandardMaterial color="#e8f4f8" emissive="#e8f4f8" emissiveIntensity={2} />
            </mesh>
            <mesh position={[0.6, 0.75, -2.11]}>
                <boxGeometry args={[0.35, 0.15, 0.05]} />
                <meshStandardMaterial color="#e8f4f8" emissive="#e8f4f8" emissiveIntensity={2} />
            </mesh>

            {/* Taillights (red strip) */}
            <mesh position={[0, 0.85, 2.11]}>
                <boxGeometry args={[1.5, 0.12, 0.05]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2.5} />
            </mesh>

            {/* Rear spoiler (aerodynamic detail) */}
            <mesh position={[0, 1.25, 1.9]} castShadow>
                <boxGeometry args={[1.4, 0.08, 0.3]} />
                <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.7} />
            </mesh>
        </group>
    );
}
