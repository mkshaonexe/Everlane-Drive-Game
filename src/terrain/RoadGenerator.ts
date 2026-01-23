import { Vector3, CatmullRomCurve3 } from 'three';
import { NoiseGenerator } from './NoiseGenerator';

export class RoadGenerator {
    noise: NoiseGenerator;

    constructor(noise: NoiseGenerator) {
        this.noise = noise;
    }

    generatePath(startPoint: Vector3, startDirection: Vector3, length: number = 200): CatmullRomCurve3 {
        const points: Vector3[] = [startPoint];
        let currentPos = startPoint.clone();
        let currentDir = startDirection.clone().normalize();

        const segmentLength = 20;
        const segments = length / segmentLength;

        for (let i = 0; i < segments; i++) {
            // Simple wander behavior for now
            // In full version, this samples multiple directions for lowest cost

            // Add slight noise to direction
            const angleNoise = this.noise.getNoise(currentPos.x, currentPos.z, 0.05) * 0.5; // Radians turn

            const newDir = currentDir.clone().applyAxisAngle(new Vector3(0, 1, 0), angleNoise);
            currentDir.lerp(newDir, 0.5).normalize();

            const nextPos = currentPos.clone().add(currentDir.clone().multiplyScalar(segmentLength));

            // Sample terrain height
            const height = this.noise.getHeight(nextPos.x, nextPos.z);

            // Slope limiting/Smoothing
            // Don't allow road to go up/down too fast compared to previous point
            const prevY = currentPos.y;
            const heightDiff = height - prevY;
            const maxSlopePerSegment = 2.0; // Max 2m rise per 20m run (~10% grade)

            if (heightDiff > maxSlopePerSegment) {
                nextPos.y = prevY + maxSlopePerSegment;
            } else if (heightDiff < -maxSlopePerSegment) {
                nextPos.y = prevY - maxSlopePerSegment;
            } else {
                nextPos.y = height + 0.5;
                // Blend slightly with previous to smooth further
                nextPos.y = (nextPos.y + prevY) * 0.5;
            }

            points.push(nextPos);
            currentPos = nextPos;
        }

        return new CatmullRomCurve3(points);
    }
}
