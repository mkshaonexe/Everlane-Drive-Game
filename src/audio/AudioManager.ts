export class AudioManager {
    private static instance: AudioManager;
    public context: AudioContext;
    public masterGain: GainNode;

    private constructor() {
        // Create context but it starts suspended usually
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        this.masterGain.gain.value = 0.5; // Default volume
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    public async resume() {
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
    }
}
