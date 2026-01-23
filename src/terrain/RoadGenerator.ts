import { Vector3, CatmullRomCurve3 } from 'three';
import { NoiseGenerator } from './NoiseGenerator';

export class RoadGenerator {
    noise: NoiseGenerator;
    private lastPoint: Vector3;
    private lastDirection: Vector3;
    private allPoints: Vector3[] = [];

    constructor(noise: NoiseGenerator) {
        this.noise = noise;
        this.lastPoint = new Vector3(0, 0, 0);
        this.lastDirection = new Vector3(0, 0, 1); // Start heading forward (positive Z)
    }

    /**
     * Generate initial road path
     */
    generatePath(startPoint: Vector3, startDirection: Vector3, length: number = 200): CatmullRomCurve3 {
        const points: Vector3[] = [startPoint];
        let currentPos = startPoint.clone();
        let currentDir = startDirection.clone().normalize();

        const segmentLength = 20;
        const segments = length / segmentLength;

        for (let i = 0; i < segments; i++) {
            const nextPoint = this.generateNextSegment(currentPos, currentDir, segmentLength);
            points.push(nextPoint.position);

            currentPos = nextPoint.position;
            currentDir = nextPoint.direction;
        }

        // Store state for continuous generation
        this.lastPoint = currentPos;
        this.lastDirection = currentDir;
        this.allPoints = points;

        return new CatmullRomCurve3(points);
    }

    /**
     * Extend the road path forward by a certain length
     * Returns the new spline including all previous points
     */
    extendPath(additionalLength: number = 200): CatmullRomCurve3 {
        const segmentLength = 20;
        const segments = additionalLength / segmentLength;

        let currentPos = this.lastPoint.clone();
        let currentDir = this.lastDirection.clone();

        for (let i = 0; i < segments; i++) {
            const nextPoint = this.generateNextSegment(currentPos, currentDir, segmentLength);
            this.allPoints.push(nextPoint.position);

            currentPos = nextPoint.position;
            currentDir = nextPoint.direction;
        }

        // Update state
        this.lastPoint = currentPos;
        this.lastDirection = currentDir;

        return new CatmullRomCurve3(this.allPoints);
    }

    /**
     * Generate a single road segment
     */
    private generateNextSegment(
        currentPos: Vector3,
        currentDir: Vector3,
        segmentLength: number
    ): { position: Vector3; direction: Vector3 } {
        // Add noise-based wandering to direction
        const angleNoise = this.noise.getNoise(currentPos.x, currentPos.z, 0.05) * 0.5; // Radians

        const newDir = currentDir.clone().applyAxisAngle(new Vector3(0, 1, 0), angleNoise);
        const smoothDir = currentDir.clone().lerp(newDir, 0.5).normalize();

        const nextPos = currentPos.clone().add(smoothDir.clone().multiplyScalar(segmentLength));

        // Sample terrain height
        const height = this.noise.getHeight(nextPos.x, nextPos.z);

        // Slope limiting - allow steeper slopes for hill following
        const prevY = currentPos.y;
        const heightDiff = height - prevY;
        const maxSlopePerSegment = 4.0; // Max 4m rise per 20m run (20% grade) - reasonable for roads

        if (heightDiff > maxSlopePerSegment) {
            nextPos.y = prevY + maxSlopePerSegment;
        } else if (heightDiff < -maxSlopePerSegment) {
            nextPos.y = prevY - maxSlopePerSegment;
        } else {
            // Follow terrain closely with minimal offset
            const targetY = height + 0.15; // Just barely above terrain
            // Smooth lerp towards target for gradual transitions
            nextPos.y = prevY * 0.3 + targetY * 0.7;
        }

        return {
            position: nextPos,
            direction: smoothDir
        };
    }

    /**
     * Get the current end point of the road
     */
    getLastPoint(): Vector3 {
        return this.lastPoint.clone();
    }

    /**
     * Get total road length generated
     */
    getTotalLength(): number {
        return this.allPoints.length * 20; // Each segment is 20m
    }
}
