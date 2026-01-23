import { Vector3 } from 'three';
import { CHUNK_SIZE } from '../utils/constants';

export class ChunkManager {
    currentChunkId: string = "0_0";

    getChunkId(position: Vector3): string {
        const x = Math.floor(position.x / CHUNK_SIZE);
        const z = Math.floor(position.z / CHUNK_SIZE);
        return `${x}_${z}`;
    }

    update(playerPosition: Vector3) {
        const newChunkId = this.getChunkId(playerPosition);
        if (newChunkId !== this.currentChunkId) {
            // console.log(`Changed chunk from ${this.currentChunkId} to ${newChunkId}`);
            this.currentChunkId = newChunkId;
            // Trigger chunk loading/unloading here in future phases
        }
    }
}
