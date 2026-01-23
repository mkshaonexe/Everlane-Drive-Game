import { createNoise2D } from 'simplex-noise';

export class NoiseGenerator {
    private noise2D: (x: number, y: number) => number;

    constructor(_seed: string | number = 'slow-roads') {
        // In a real implementation we'd use the seed. 
        // basic simplex-noise createNoise2D provides a random one usually, 
        // but looking at docs it might need a alea PRNG for seeding if we want strict determinism.
        // For now, we will rely on defaults or implement a seeded wrapper if needed.
        this.noise2D = createNoise2D();
    }

    /**
     * Fractal Brownian Motion (FBM) noise
     */
    getExampleHeight(x: number, z: number): number {
        let y = 0;
        let amplitude = 1;
        let frequency = 0.005;

        // 4 Octaves
        for (let i = 0; i < 4; i++) {
            y += this.noise2D(x * frequency, z * frequency) * amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        // Scale and bias
        return Math.pow(y * 0.5 + 0.5, 2) * 50;
    }

    getNoise(x: number, z: number, frequency: number = 0.01): number {
        return this.noise2D(x * frequency, z * frequency);
    }
}
