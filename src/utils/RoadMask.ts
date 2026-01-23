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
    private roadHeights: Map<string, number> = new Map();

    constructor(path: CatmullRomCurve3, width: number = 10) {
        this.roadPoints = path.getPoints(500);
        this.roadWidth = width;

        // Pre-cache road heights for faster lookup
        for (const pt of this.roadPoints) {
            const key = this.getGridKey(pt.x, pt.z);
            if (!this.roadHeights.has(key) || pt.y > (this.roadHeights.get(key) ?? 0)) {
                this.roadHeights.set(key, pt.y);
            }
        }
    }

    /**
     * Get grid key for spatial hashing (10m grid cells)
     */
    private getGridKey(x: number, z: number): string {
        const gx = Math.floor(x / 10);
        const gz = Math.floor(z / 10);
        return `${gx}_${gz}`;
    }

    /**
     * Returns distance to nearest road point (0 = on road center, < width/2 = on road surface)
     */
    getDistanceToRoad(worldX: number, worldZ: number): number {
        let minDist = Infinity;

        for (const pt of this.roadPoints) {
            const dx = worldX - pt.x;
            const dz = worldZ - pt.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < minDist) {
                minDist = dist;
            }

            // Early exit if we're clearly on the road
            if (minDist < this.roadWidth / 4) {
                break;
            }
        }

        return minDist;
    }

    /**
     * Returns the road height at this position, or null if not near road.
     * Uses interpolation for smooth transitions.
     */
    getRoadHeight(worldX: number, worldZ: number): number | null {
        let nearestPt: Vector3 | null = null;
        let secondPt: Vector3 | null = null;
        let minDist = Infinity;
        let secondDist = Infinity;

        for (const pt of this.roadPoints) {
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

    /**
     * Get all road points for vegetation checks
     */
    getRoadPoints(): Vector3[] {
        return this.roadPoints;
    }
}
