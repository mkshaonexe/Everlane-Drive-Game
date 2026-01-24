/**
 * Terrain Worker - Computes terrain vertex heights and colors in a background thread
 * This prevents main thread blocking during chunk generation
 */

import { createNoise2D } from 'simplex-noise';
import type { TerrainWorkerInput, TerrainWorkerOutput, TerrainWorkerError } from './workerTypes';

// Worker-local noise function (each worker has its own instance)
let noise2D: ((x: number, y: number) => number) | null = null;

function initNoise(_seed: string) {
    if (!noise2D) {
        noise2D = createNoise2D();
    }
}

function getHeight(_x: number, _z: number): number {
    // FLAT WORLD - matching NoiseGenerator
    return 0;
}

function getNoise(x: number, z: number, frequency: number = 0.01): number {
    if (!noise2D) return 0;
    return noise2D(x * frequency, z * frequency);
}

/**
 * Generate terrain data for a single chunk
 */
function generateTerrainData(input: TerrainWorkerInput): TerrainWorkerOutput {
    const { chunkX, chunkZ, resolution, chunkSize, noiseSeed } = input;

    initNoise(noiseSeed);

    const vertexCount = resolution * resolution;
    const heights = new Float32Array(vertexCount);
    const colors = new Float32Array(vertexCount * 3); // RGB

    // Color palette - matching TerrainChunk.tsx
    const darkGrass = { r: 0.227, g: 0.420, b: 0.165 };   // #3a6b2a
    const lightGrass = { r: 0.353, g: 0.545, b: 0.290 };  // #5a8b4a
    const yellowGrass = { r: 0.545, g: 0.608, b: 0.290 }; // #8b9b4a
    const richSoil = { r: 0.420, g: 0.302, b: 0.200 };    // #6b4d33
    const sandyDirt = { r: 0.651, g: 0.565, b: 0.439 };   // #a69070

    const step = chunkSize / (resolution - 1);

    for (let iz = 0; iz < resolution; iz++) {
        for (let ix = 0; ix < resolution; ix++) {
            const idx = iz * resolution + ix;

            // Local position within chunk
            const lx = (ix - (resolution - 1) / 2) * step;
            const lz = (iz - (resolution - 1) / 2) * step;

            // World coordinates
            const wx = chunkX + lx;
            const wz = chunkZ + lz;

            // Get height
            const h = getHeight(wx, wz);
            heights[idx] = h;

            // Calculate color
            let r = darkGrass.r;
            let g = darkGrass.g;
            let b = darkGrass.b;

            // Multi-octave noise for natural color variation
            const n1 = getNoise(wx * 0.015, wz * 0.015, 0.1);
            const n2 = getNoise(wx * 0.06, wz * 0.06, 0.1);
            const n3 = getNoise(wx * 0.12, wz * 0.12, 0.1);
            const combinedNoise = n1 * 0.5 + n2 * 0.35 + n3 * 0.15;

            // Blend to light grass
            const lightBlend = combinedNoise * 0.6 + 0.2;
            r = r + (lightGrass.r - r) * lightBlend;
            g = g + (lightGrass.g - g) * lightBlend;
            b = b + (lightGrass.b - b) * lightBlend;

            // Add yellow on higher elevations
            const heightFactor = Math.min(1, Math.max(0, (h - 8) / 25));
            const yellowBlend = heightFactor * 0.35 + combinedNoise * 0.15;
            r = r + (yellowGrass.r - r) * yellowBlend;
            g = g + (yellowGrass.g - g) * yellowBlend;
            b = b + (yellowGrass.b - b) * yellowBlend;

            // Dirt patches
            const dirtNoise = getNoise(wx * 0.08, wz * 0.08, 0.3);
            const dirtNoise2 = getNoise(wx * 0.2, wz * 0.2, 0.5);
            const combinedDirt = dirtNoise * 0.7 + dirtNoise2 * 0.3;

            if (combinedDirt > 0.55) {
                const dirtBlend = (combinedDirt - 0.55) * 2.0 * 0.6;
                r = r + (richSoil.r - r) * dirtBlend;
                g = g + (richSoil.g - g) * dirtBlend;
                b = b + (richSoil.b - b) * dirtBlend;
            }

            // Sandy dirt in low areas
            const lowAreaNoise = getNoise(wx * 0.05, wz * 0.05, 0.2);
            if (h < 3 && lowAreaNoise > 0.4) {
                const sandBlend = (1 - h / 3) * (lowAreaNoise - 0.4) * 2 * 0.4;
                r = r + (sandyDirt.r - r) * sandBlend;
                g = g + (sandyDirt.g - g) * sandBlend;
                b = b + (sandyDirt.b - b) * sandBlend;
            }

            // Store colors
            colors[idx * 3] = r;
            colors[idx * 3 + 1] = g;
            colors[idx * 3 + 2] = b;
        }
    }

    return {
        type: 'TERRAIN_RESULT',
        chunkX,
        chunkZ,
        heights,
        colors
    };
}

// Worker message handler
self.onmessage = (event: MessageEvent<TerrainWorkerInput>) => {
    const input = event.data;

    if (input.type === 'GENERATE_TERRAIN') {
        try {
            const result = generateTerrainData(input);
            // Transfer the Float32Arrays for zero-copy performance
            self.postMessage(result, [result.heights.buffer, result.colors.buffer]);
        } catch (error) {
            const errorResponse: TerrainWorkerError = {
                type: 'TERRAIN_ERROR',
                chunkX: input.chunkX,
                chunkZ: input.chunkZ,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            self.postMessage(errorResponse);
        }
    }
};

export { };
