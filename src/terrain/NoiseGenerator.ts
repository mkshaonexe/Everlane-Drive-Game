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
    getHeight(x: number, z: number): number {
        // FLAT WORLD - Always return 0
        return 0;
    }

    getNoise(x: number, z: number, frequency: number = 0.01): number {
        return this.noise2D(x * frequency, z * frequency);
    }
}
