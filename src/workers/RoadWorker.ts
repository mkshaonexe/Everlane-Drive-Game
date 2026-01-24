/**
 * Road Worker - Generates road path points in a background thread
 * This prevents main thread blocking during road extension
 */

import { createNoise2D } from 'simplex-noise';
import type { RoadWorkerInput, RoadWorkerOutput, RoadWorkerError, RoadPoint } from './workerTypes';

// Worker-local noise function
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

// Vector math utilities (can't use Three.js in worker)
function normalize(v: RoadPoint): RoadPoint {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (len === 0) return { x: 0, y: 0, z: 1 };
    return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function lerp(a: RoadPoint, b: RoadPoint, t: number): RoadPoint {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t
    };
}

function rotateY(v: RoadPoint, angle: number): RoadPoint {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: v.x * cos + v.z * sin,
        y: v.y,
        z: -v.x * sin + v.z * cos
    };
}

function add(a: RoadPoint, b: RoadPoint): RoadPoint {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(v: RoadPoint, s: number): RoadPoint {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
}

/**
 * Generate next road segment
 */
function generateNextSegment(
    currentPos: RoadPoint,
    currentDir: RoadPoint,
    segmentLength: number
): { position: RoadPoint; direction: RoadPoint } {
    // Add noise-based wandering to direction
    const angleNoise = getNoise(currentPos.x, currentPos.z, 0.05) * 0.5;

    const newDir = rotateY(currentDir, angleNoise);
    const smoothDir = normalize(lerp(currentDir, newDir, 0.5));

    const nextPos = add(currentPos, scale(smoothDir, segmentLength));

    // Sample terrain height
    const height = getHeight(nextPos.x, nextPos.z);

    // Slope limiting
    const prevY = currentPos.y;
    const heightDiff = height - prevY;
    const maxSlopePerSegment = 4.0;

    if (heightDiff > maxSlopePerSegment) {
        nextPos.y = prevY + maxSlopePerSegment;
    } else if (heightDiff < -maxSlopePerSegment) {
        nextPos.y = prevY - maxSlopePerSegment;
    } else {
        const targetY = height + 0.15;
        nextPos.y = prevY * 0.3 + targetY * 0.7;
    }

    return {
        position: nextPos,
        direction: smoothDir
    };
}

/**
 * Generate initial road path
 */
function generatePath(
    startPoint: RoadPoint,
    startDirection: RoadPoint,
    length: number
): RoadWorkerOutput {
    const points: RoadPoint[] = [startPoint];
    let currentPos = { ...startPoint };
    let currentDir = normalize(startDirection);

    const segmentLength = 20;
    const segments = length / segmentLength;

    for (let i = 0; i < segments; i++) {
        const next = generateNextSegment(currentPos, currentDir, segmentLength);
        points.push(next.position);
        currentPos = next.position;
        currentDir = next.direction;
    }

    return {
        type: 'ROAD_RESULT',
        points,
        lastPoint: currentPos,
        lastDirection: currentDir
    };
}

/**
 * Extend existing road path
 */
function extendPath(
    lastPoint: RoadPoint,
    lastDirection: RoadPoint,
    allPoints: RoadPoint[],
    additionalLength: number
): RoadWorkerOutput {
    const newPoints = [...allPoints];
    let currentPos = { ...lastPoint };
    let currentDir = { ...lastDirection };

    const segmentLength = 20;
    const segments = additionalLength / segmentLength;

    for (let i = 0; i < segments; i++) {
        const next = generateNextSegment(currentPos, currentDir, segmentLength);
        newPoints.push(next.position);
        currentPos = next.position;
        currentDir = next.direction;
    }

    return {
        type: 'ROAD_RESULT',
        points: newPoints,
        lastPoint: currentPos,
        lastDirection: currentDir
    };
}

// Worker message handler
self.onmessage = (event: MessageEvent<RoadWorkerInput>) => {
    const input = event.data;

    try {
        initNoise(input.noiseSeed);

        let result: RoadWorkerOutput;

        if (input.type === 'GENERATE_PATH') {
            result = generatePath(
                input.startPoint || { x: 0, y: 0, z: 0 },
                input.startDirection || { x: 0, y: 0, z: 1 },
                input.length || 200
            );
        } else if (input.type === 'EXTEND_PATH') {
            result = extendPath(
                input.lastPoint || { x: 0, y: 0, z: 0 },
                input.lastDirection || { x: 0, y: 0, z: 1 },
                input.allPoints || [],
                input.additionalLength || 200
            );
        } else {
            throw new Error('Unknown message type');
        }

        self.postMessage(result);
    } catch (error) {
        const errorResponse: RoadWorkerError = {
            type: 'ROAD_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
        self.postMessage(errorResponse);
    }
};

export { };
