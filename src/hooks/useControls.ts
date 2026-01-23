import { useState, useEffect } from 'react'

export function useControls() {
    const [controls, setControls] = useState({
        forward: false,
        backward: false,
        left: false,
        right: false,
    })

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    setControls((c) => ({ ...c, forward: true }))
                    break
                case 'KeyS':
                case 'ArrowDown':
                    setControls((c) => ({ ...c, backward: true }))
                    break
                case 'KeyA':
                case 'ArrowLeft':
                    setControls((c) => ({ ...c, left: true }))
                    break
                case 'KeyD':
                case 'ArrowRight':
                    setControls((c) => ({ ...c, right: true }))
                    break
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    setControls((c) => ({ ...c, forward: false }))
                    break
                case 'KeyS':
                case 'ArrowDown':
                    setControls((c) => ({ ...c, backward: false }))
                    break
                case 'KeyA':
                case 'ArrowLeft':
                    setControls((c) => ({ ...c, left: false }))
                    break
                case 'KeyD':
                case 'ArrowRight':
                    setControls((c) => ({ ...c, right: false }))
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

    return controls
}
