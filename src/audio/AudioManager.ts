export class AudioManager {
    private static instance: AudioManager;
    public context: AudioContext;
    public masterGain: GainNode;
    private resumeHandlerAdded: boolean = false;

    private constructor() {
        // Create context but it starts suspended usually
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        this.masterGain.gain.value = 0.5; // Default volume

        // Auto-resume on first user gesture
        this.setupAutoResume();
    }

    private setupAutoResume() {
        if (this.resumeHandlerAdded) return;

        const resumeHandler = async () => {
            await this.resume();
            document.removeEventListener('click', resumeHandler);
            document.removeEventListener('keydown', resumeHandler);
            document.removeEventListener('touchstart', resumeHandler);
        };

        document.addEventListener('click', resumeHandler);
        document.addEventListener('keydown', resumeHandler);
        document.addEventListener('touchstart', resumeHandler);
        this.resumeHandlerAdded = true;
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

    public isReady(): boolean {
        return this.context.state === 'running';
    }
}
