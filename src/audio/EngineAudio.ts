import { AudioManager } from './AudioManager';

export class EngineAudio {
    private oscillator: OscillatorNode | null = null;
    private gainNode: GainNode | null = null;
    private isRunning: boolean = false;
    private audioManager: AudioManager;

    constructor() {
        this.audioManager = AudioManager.getInstance();
    }

    start() {
        if (this.isRunning) return;

        const ctx = this.audioManager.context;

        // Simple Sawtooth wave for rough engine sound
        this.oscillator = ctx.createOscillator();
        this.oscillator.type = 'sawtooth';
        this.oscillator.frequency.value = 100; // Idle

        this.gainNode = ctx.createGain();
        this.gainNode.gain.value = 0;

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioManager.masterGain);

        this.oscillator.start();
        this.isRunning = true;
    }

    update(speed: number) {
        if (!this.isRunning || !this.oscillator || !this.gainNode) return;

        // Map speed to RPM/Pitch
        // Speed 0 -> 80Hz
        // Speed 50 -> 400Hz
        const absoluteSpeed = Math.abs(speed);
        const pitch = 80 + absoluteSpeed * 5;

        // Smooth transition
        const now = this.audioManager.context.currentTime;
        this.oscillator.frequency.setTargetAtTime(pitch, now, 0.1);

        // Volume based on speed (simulating load roughly)
        // Idle volume lower
        const volume = 0.1 + (absoluteSpeed / 60) * 0.2;
        this.gainNode.gain.setTargetAtTime(Math.min(volume, 0.4), now, 0.1);
    }

    stop() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
        this.isRunning = false;
    }
}
