import { Vector3, CatmullRomCurve3 } from 'three';

/**
 * RoadMask - Utility class to detect if a world position is on or near the road path.
 * Used for:
 * 1. Flattening terrain under road
 * 2. Preventing vegetation spawning on road
 * 3. Detecting if vehicle is on road for physics
 */
export class RoadMask {
    private roadPoints: Vector3[];
    private roadWidth: number;
    private grid: Map<string, Vector3[]> = new Map();

    constructor(path: CatmullRomCurve3, width: number = 10) {
        this.roadPoints = path.getPoints(Math.floor(path.getLength() / 2)); // 1 point per 2m approx
        this.roadWidth = width;

        // Build spatial grid
        for (const pt of this.roadPoints) {
            const key = this.getGridKey(pt.x, pt.z);
            if (!this.grid.has(key)) {
                this.grid.set(key, []);
            }
            this.grid.get(key)!.push(pt);
        }
    }

    /**
     * Get grid key for spatial hashing (20m grid cells)
     */
    private getGridKey(x: number, z: number): string {
        const gx = Math.floor(x / 20);
        const gz = Math.floor(z / 20);
        return `${gx}_${gz}`;
    }

    /**
     * Get nearby points from grid (3x3 area)
     */
    private getNearbyPoints(x: number, z: number): Vector3[] {
        const points: Vector3[] = [];
        const gx = Math.floor(x / 20);
        const gz = Math.floor(z / 20);

        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const key = `${gx + dx}_${gz + dz}`;
                const cellPoints = this.grid.get(key);
                if (cellPoints) {
                    points.push(...cellPoints);
                }
            }
        }
        return points;
    }

    /**
     * Returns distance to nearest road point (0 = on road center, < width/2 = on road surface)
     */
    getDistanceToRoad(worldX: number, worldZ: number): number {
        const nearby = this.getNearbyPoints(worldX, worldZ);
        if (nearby.length === 0) return Infinity;

        let minDist = Infinity;
        for (const pt of nearby) {
            const dx = worldX - pt.x;
            const dz = worldZ - pt.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < minDist) minDist = dist;
        }
        return minDist;
    }

    /**
     * Returns the road height at this position, or null if not near road.
     * Uses interpolation for smooth transitions.
     */
    getRoadHeight(worldX: number, worldZ: number): number | null {
        const nearby = this.getNearbyPoints(worldX, worldZ);
        if (nearby.length === 0) return null;

        let nearestPt: Vector3 | null = null;
        let secondPt: Vector3 | null = null;
        let minDist = Infinity;
        let secondDist = Infinity;

        for (const pt of nearby) {
            const dx = worldX - pt.x;
            const dz = worldZ - pt.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < minDist) {
                secondDist = minDist;
                secondPt = nearestPt;
                minDist = dist;
                nearestPt = pt;
            } else if (dist < secondDist) {
                secondDist = dist;
                secondPt = pt;
            }
        }

        if (!nearestPt || minDist > this.roadWidth * 1.5) {
            return null;
        }

        // Interpolate height between two nearest points
        if (secondPt && secondDist < this.roadWidth * 2) {
            const totalDist = minDist + secondDist;
            const t = minDist / totalDist;
            return nearestPt.y * (1 - t) + secondPt.y * t;
        }

        return nearestPt.y;
    }

    /**
     * Returns whether position is on road surface
     */
    isOnRoad(worldX: number, worldZ: number): boolean {
        return this.getDistanceToRoad(worldX, worldZ) < this.roadWidth / 2;
    }

    /**
     * Get road width
     */
    getWidth(): number {
        return this.roadWidth;
    }
}
