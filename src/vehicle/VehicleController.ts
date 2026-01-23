import { AudioManager } from '../audio/AudioManager';
import { useGameStore } from '../stores/gameStore';

export interface InputState {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    brake: boolean;
    reset: boolean;
}

export class VehicleController {
    public input: InputState = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        brake: false,
        reset: false,
    };

    // Free look mouse sensitivity
    private mouseSensitivity: number = 0.003;

    constructor() {
        this.addEventListeners();
    }

    private onKeyDown = (event: KeyboardEvent) => {
        // Resume audio context on user interaction
        AudioManager.getInstance().resume();

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.input.forward = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.input.backward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.input.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.input.right = true;
                break;
            case 'Space':
                this.input.brake = true;
                break;
            case 'KeyR':
                this.input.reset = true;
                break;
        }
    };

    private onKeyUp = (event: KeyboardEvent) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.input.forward = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.input.backward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.input.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.input.right = false;
                break;
            case 'Space':
                this.input.brake = false;
                break;
            case 'KeyR':
                this.input.reset = false;
                break;
        }
    };

    private onMouseDown = (event: MouseEvent) => {
        // Right mouse button (button 2) - always activate free look for rotation
        if (event.button === 2) {
            const store = useGameStore.getState();
            store.setFreeLookActive(true);
        }
        // Middle mouse button (button 1) - reset camera angle
        if (event.button === 1) {
            const store = useGameStore.getState();
            store.resetFreeLookAngles();
        }
    };

    private onMouseUp = (event: MouseEvent) => {
        if (event.button === 2) {
            const store = useGameStore.getState();
            store.setFreeLookActive(false);
            // If eye button is NOT active, reset angles on release (old behavior)
            // If eye button IS active, keep the angles (persistent camera)
            if (!store.isFreeLookButtonActive) {
                store.resetFreeLookAngles();
            }
            // When eye button is active, angles persist after release
        }
    };

    private onMouseMove = (event: MouseEvent) => {
        const store = useGameStore.getState();

        // Only update angles if free look is active
        if (store.isFreeLookActive) {
            const deltaX = event.movementX * this.mouseSensitivity;
            const deltaY = -event.movementY * this.mouseSensitivity;
            store.updateFreeLookAngles(deltaX, deltaY);
        }
    };

    private onContextMenu = (event: MouseEvent) => {
        // Prevent context menu when right-clicking for camera rotation
        event.preventDefault();
    };

    private onWheel = (event: WheelEvent) => {
        const store = useGameStore.getState();
        // Use scroll to zoom in/out
        // deltaY > 0 means scrolling down (zoom out), deltaY < 0 means scrolling up (zoom in)
        const zoomDelta = event.deltaY * 0.005; // Sensitivity factor
        store.updateCameraZoom(zoomDelta);
        event.preventDefault();
    };

    private addEventListeners() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('contextmenu', this.onContextMenu);
        window.addEventListener('wheel', this.onWheel, { passive: false });
    }

    public dispose() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('contextmenu', this.onContextMenu);
        window.removeEventListener('wheel', this.onWheel);
    }
}
