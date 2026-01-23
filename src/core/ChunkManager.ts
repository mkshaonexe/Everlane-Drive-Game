import { Vector3 } from 'three';
import { CHUNK_SIZE } from '../utils/constants';

interface ChunkCoord {
    x: number;
    z: number;
}

export interface ChunkUpdate {
    chunksToLoad: Vector3[];
    chunksToUnload: string[];
}

export class ChunkManager {
    private loadedChunks: Set<string> = new Set();
    private viewDistance: number = 5; // 5 chunks in each direction for better coverage

    /**
     * Get chunk coordinate from world position
     */
    getChunkCoord(position: Vector3): ChunkCoord {
        return {
            x: Math.floor(position.x / CHUNK_SIZE),
            z: Math.floor(position.z / CHUNK_SIZE)
        };
    }

    /**
     * Convert chunk coordinate to chunk ID string
     */
    getChunkId(coord: ChunkCoord): string {
        return `${coord.x}_${coord.z}`;
    }

    /**
     * Convert chunk coordinate to world position (center of chunk)
     */
    chunkToWorldPos(coord: ChunkCoord): Vector3 {
        return new Vector3(
            coord.x * CHUNK_SIZE,
            0,
            coord.z * CHUNK_SIZE
        );
    }

    /**
     * Update loaded chunks based on player position
     * Returns chunks to load and unload
     */
    update(playerPosition: Vector3): ChunkUpdate {
        const playerChunk = this.getChunkCoord(playerPosition);
        const chunksToLoad: Vector3[] = [];
        const chunksToUnload: string[] = [];

        // Find chunks that should be loaded
        const shouldBeLoaded = new Set<string>();

        for (let dx = -this.viewDistance; dx <= this.viewDistance; dx++) {
            for (let dz = -this.viewDistance; dz <= this.viewDistance; dz++) {
                const chunkCoord: ChunkCoord = {
                    x: playerChunk.x + dx,
                    z: playerChunk.z + dz
                };
                const chunkId = this.getChunkId(chunkCoord);
                shouldBeLoaded.add(chunkId);

                // If not already loaded, mark for loading
                if (!this.loadedChunks.has(chunkId)) {
                    chunksToLoad.push(this.chunkToWorldPos(chunkCoord));
                    this.loadedChunks.add(chunkId);
                }
            }
        }

        // Find chunks that should be unloaded
        for (const chunkId of this.loadedChunks) {
            if (!shouldBeLoaded.has(chunkId)) {
                chunksToUnload.push(chunkId);
                this.loadedChunks.delete(chunkId);
            }
        }

        return { chunksToLoad, chunksToUnload };
    }

    /**
     * Get all currently loaded chunk IDs
     */
    getLoadedChunks(): string[] {
        return Array.from(this.loadedChunks);
    }

    /**
     * Check if a chunk is loaded
     */
    isChunkLoaded(chunkId: string): boolean {
        return this.loadedChunks.has(chunkId);
    }

    /**
     * Set view distance (how many chunks in each direction)
     */
    setViewDistance(distance: number) {
        this.viewDistance = Math.max(1, Math.min(distance, 10)); // Clamp 1-10
    }
}
