import { useVehiclePhysics } from '../hooks/useVehiclePhysics'

interface VehicleProps {
    position: [number, number, number]
}

export function Vehicle({ position }: VehicleProps) {
    const chassisRef = useVehiclePhysics(position)

    return (
        <group ref={chassisRef}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1, 0.5, 2]} />
                <meshStandardMaterial color="orange" />
            </mesh>

            {/* Visual Wheels (Static for now) */}
            <mesh position={[0.6, -0.25, 0.8]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[-0.6, -0.25, 0.8]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0.6, -0.25, -0.8]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[-0.6, -0.25, -0.8]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        </group>
    )
}
