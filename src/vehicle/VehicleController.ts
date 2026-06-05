import { AudioManager } from '../audio/AudioManager';
import { useGameStore } from '../stores/gameStore';

export interface InputState {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    brake: boolean;
    reset: boolean;
    boost: boolean;
}

export class VehicleController {
    public input: InputState = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        brake: false,
        reset: false,
        boost: false,
    };

    // Free look mouse sensitivity
    private mouseSensitivity: number = 0.003;

    constructor() {
        // Event listeners are added in setup() during useEffect to avoid React render phase side effects
    }

    public setup() {
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
            case 'ShiftLeft':
            case 'ShiftRight':
                this.input.boost = true;
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
            case 'ShiftLeft':
            case 'ShiftRight':
                this.input.boost = false;
                break;
        }
    };

    private onMouseDown = (event: MouseEvent) => {
        // Button 0 (Left) or Button 2 (Right) - always activate free look for rotation
        // This handles users who might confuse buttons or prefer left-click drag
        if (event.button === 0 || event.button === 2) {
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
        // Check for Left (0) or Right (2) release
        if (event.button === 0 || event.button === 2) {
            const store = useGameStore.getState();
            store.setFreeLookActive(false);
            // If eye button is NOT active, reset angles on release
            // If eye button IS active, keep the angles (persistent camera)
            if (!store.isFreeLookButtonActive) {
                store.resetFreeLookAngles();
            }
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
