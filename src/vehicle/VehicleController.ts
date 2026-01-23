import { AudioManager } from '../audio/AudioManager';

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

    private addEventListeners() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    public dispose() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }
}
