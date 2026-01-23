import { useRef } from 'react'
import { Group, Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'
import { useControls } from './useControls'

export function useVehiclePhysics(initialPosition: [number, number, number]) {
    const chassisRef = useRef<Group>(null)
    const controls = useControls()

    // Physics State
    const velocity = useRef(new Vector3(0, 0, 0))
    // const angularVelocity = useRef(new Vector3(0, 0, 0))

    useFrame((state, delta) => {
        if (!chassisRef.current) return

        const chassis = chassisRef.current
        const vel = velocity.current

        // 0. Initialize position once
        // (In a real engine we handle this better, but for now we trust the initial prop was used by Parent, 
        // actually, we should set it if it's at 0,0,0 and we want to spawn elsewhere, but standard React prop flow handles initial render)

        // 1. Gravity
        vel.y -= 9.81 * delta

        // 2. Simple Ground Collision
        if (chassis.position.y < 0.5) {
            chassis.position.y = 0.5
            vel.y = 0

            // Ground Friction
            vel.x *= 0.95
            vel.z *= 0.95
        }

        // 3. Controls (Basic Arcade Force)
        const speed = 20 * delta
        if (controls.forward) vel.z -= speed
        if (controls.backward) vel.z += speed
        if (controls.left) chassis.rotation.y += 2 * delta
        if (controls.right) chassis.rotation.y -= 2 * delta

        // 4. Apply Velocity (Local to Global for movement? No, simple world space velocity + rotation logic needed)
        // For arcade:
        // Rotate velocity vector by chassis rotation? 
        // Or just apply force in forward direction.

        // Let's do simple "Move Forward" vector
        const forward = new Vector3(0, 0, -1).applyQuaternion(chassis.quaternion)

        if (controls.forward) {
            vel.add(forward.multiplyScalar(10 * delta))
        }
        if (controls.backward) {
            vel.add(forward.multiplyScalar(-5 * delta))
        }

        // Damping
        vel.x *= 0.98
        vel.z *= 0.98

        // Apply
        chassis.position.add(vel.clone().multiplyScalar(delta))
    })

    return chassisRef
}
