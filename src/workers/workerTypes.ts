/**
 * Worker Types - Shared interfaces for Web Worker communication
 * Used by both main thread and workers for type safety
 */

// ============================================
// TERRAIN WORKER TYPES
// ============================================

export interface TerrainWorkerInput {
    type: 'GENERATE_TERRAIN';
    chunkX: number;
    chunkZ: number;
    resolution: number;
    chunkSize: number;
    noiseSeed: string;
}

export interface TerrainWorkerOutput {
    type: 'TERRAIN_RESULT';
    chunkX: number;
    chunkZ: number;
    // Float32Arrays for transferable zero-copy performance
    heights: Float32Array;
    colors: Float32Array; // RGB interleaved (r,g,b,r,g,b,...)
}

export interface TerrainWorkerError {
    type: 'TERRAIN_ERROR';
    chunkX: number;
    chunkZ: number;
    error: string;
}

export type TerrainWorkerMessage = TerrainWorkerInput;
export type TerrainWorkerResponse = TerrainWorkerOutput | TerrainWorkerError;

// ============================================
// ROAD WORKER TYPES
// ============================================

export interface RoadPoint {
    x: number;
    y: number;
    z: number;
}

export interface RoadWorkerInput {
    type: 'GENERATE_PATH' | 'EXTEND_PATH';
    // For GENERATE_PATH
    startPoint?: RoadPoint;
    startDirection?: RoadPoint;
    length?: number;
    // For EXTEND_PATH
    lastPoint?: RoadPoint;
    lastDirection?: RoadPoint;
    allPoints?: RoadPoint[];
    additionalLength?: number;
    noiseSeed: string;
}

export interface RoadWorkerOutput {
    type: 'ROAD_RESULT';
    points: RoadPoint[];
    lastPoint: RoadPoint;
    lastDirection: RoadPoint;
}

export interface RoadWorkerError {
    type: 'ROAD_ERROR';
    error: string;
}

export type RoadWorkerMessage = RoadWorkerInput;
export type RoadWorkerResponse = RoadWorkerOutput | RoadWorkerError;
