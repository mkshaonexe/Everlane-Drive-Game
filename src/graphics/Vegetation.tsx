import { useRef, useLayoutEffect } from 'react';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { NoiseGenerator } from '../terrain/NoiseGenerator';
import { RoadMask } from '../utils/RoadMask';
import {
    birchTrunkGeometry,
    birchFoliageGeometry,
    birchBarkMaterial,
    goldenFoliageMaterial,
    orangeFoliageMaterial,
    redFoliageMaterial,
    pineTrunkGeometry,
    pineFoliageGeometry,
    pineBarkMaterial,
    pineNeedleMaterial,
} from './TreeModels';

interface VegetationProps {
    chunkPosition: [number, number, number];
    noise: NoiseGenerator;
    count?: number;
    roadMask?: RoadMask;
}

export function Vegetation({ chunkPosition, noise, count = 150, roadMask }: VegetationProps) {
    // Deciduous tree refs (birch/aspen with autumn colors)
    const deciduousTrunkRef = useRef<InstancedMesh>(null);
    const goldFoliageRef = useRef<InstancedMesh>(null);
    const orangeFoliageRef = useRef<InstancedMesh>(null);
    const redFoliageRef = useRef<InstancedMesh>(null);

    // Pine tree refs
    const pineTrunkRef = useRef<InstancedMesh>(null);
    const pineFoliageRef = useRef<InstancedMesh>(null);

    useLayoutEffect(() => {
        if (!deciduousTrunkRef.current || !goldFoliageRef.current ||
            !orangeFoliageRef.current || !redFoliageRef.current ||
            !pineTrunkRef.current || !pineFoliageRef.current) return;
        if (!noise) return;

        const tempObj = new Object3D();
        const [chunkX, , chunkZ] = chunkPosition;

        // Counters for each mesh type
        let deciduousTrunkIdx = 0;
        let goldIdx = 0;
        let orangeIdx = 0;
        let redIdx = 0;
        let pineTrunkIdx = 0;
        let pineIdx = 0;

        // Tree placement parameters
        const treeSpacing = 8; // Minimum spacing between trees
        const placedTrees: Vector3[] = [];

        // Helper to get local slope
        const getSlope = (nx: number, nz: number): number => {
            const h0 = noise.getHeight(nx, nz);
            const h1 = noise.getHeight(nx + 1, nz);
            const h2 = noise.getHeight(nx, nz + 1);
            const dx = h1 - h0;
            const dz = h2 - h0;
            return Math.sqrt(dx * dx + dz * dz);
        };

        try {
            for (let i = 0; i < count; i++) {
                // Random position in chunk (use 90% of chunk to avoid edge issues)
                const x = (Math.random() - 0.5) * 180;
                const z = (Math.random() - 0.5) * 180;

                const worldX = chunkX + x;
                const worldZ = chunkZ + z;

                // Road Avoidance
                if (roadMask) {
                    const distToRoad = roadMask.getDistanceToRoad(worldX, worldZ);
                    if (distToRoad < 12) continue; // slightly reduced from 15 to allow roadside trees
                }

                // Slope Check
                const slope = getSlope(worldX, worldZ);
                if (slope > 1.5) continue; // Skip steep slopes

                // Density / Clustering Check
                // Use a different noise frequency for forest density
                const density = noise.getNoise(worldX * 0.05, worldZ * 0.05, 123);
                if (density < -0.2) continue; // Open clearings

                // Check spacing from other trees
                let tooClose = false;
                for (const placed of placedTrees) {
                    const dx = worldX - placed.x;
                    const dz = worldZ - placed.z;
                    if (dx * dx + dz * dz < treeSpacing * treeSpacing) {
                        tooClose = true;
                        break;
                    }
                }

                // If in high density area (density > 0.4), allow some overlap/closer spacing
                if (tooClose) {
                    if (density > 0.4 && Math.random() > 0.7) {
                        // Allow it
                    } else {
                        continue;
                    }
                }

                // Get EXACT terrain height at this position
                const groundHeight = noise.getHeight(worldX, worldZ);

                // Add small height offset to bury roots into slope slightly if needed
                // But generally 0 is fine with our root flares.

                // Scale variation for natural look
                const scale = 0.8 + Math.random() * 0.6; // 0.8 to 1.4
                const rotation = Math.random() * Math.PI * 2;

                // Decide tree type based on zone noise
                const zoneNoise = noise.getNoise(worldX * 0.01, worldZ * 0.01, 0.5);
                const isPine = zoneNoise > 0.4; // Slightly more pines

                if (isPine) {
                    // === PINE TREE ===
                    tempObj.position.set(x, groundHeight, z);
                    tempObj.scale.set(scale, scale, scale);
                    tempObj.rotation.set(0, rotation, 0);
                    tempObj.updateMatrix();
                    if (pineTrunkIdx < count) {
                        pineTrunkRef.current.setMatrixAt(pineTrunkIdx++, tempObj.matrix);
                    }

                    // Foliage
                    tempObj.position.set(x, groundHeight, z);
                    tempObj.scale.set(scale, scale, scale);
                    tempObj.rotation.set(0, rotation, 0);
                    tempObj.updateMatrix();
                    if (pineIdx < count) {
                        pineFoliageRef.current.setMatrixAt(pineIdx++, tempObj.matrix);
                    }
                } else {
                    // === DECIDUOUS TREE ===
                    tempObj.position.set(x, groundHeight, z);
                    tempObj.scale.set(scale, scale, scale);
                    tempObj.rotation.set(0, rotation, 0);
                    tempObj.updateMatrix();
                    if (deciduousTrunkIdx < count) {
                        deciduousTrunkRef.current.setMatrixAt(deciduousTrunkIdx++, tempObj.matrix);
                    }

                    // Foliage
                    tempObj.position.set(x, groundHeight, z);
                    tempObj.scale.set(scale, scale, scale);
                    tempObj.rotation.set(0, rotation, 0);
                    tempObj.updateMatrix();

                    // Randomly assign foliage color
                    const colorRoll = Math.random();
                    if (colorRoll < 0.45) {
                        if (goldIdx < count) goldFoliageRef.current.setMatrixAt(goldIdx++, tempObj.matrix);
                    } else if (colorRoll < 0.8) {
                        if (orangeIdx < count) orangeFoliageRef.current.setMatrixAt(orangeIdx++, tempObj.matrix);
                    } else {
                        if (redIdx < count) redFoliageRef.current.setMatrixAt(redIdx++, tempObj.matrix);
                    }
                }

                placedTrees.push(new Vector3(worldX, groundHeight, worldZ));
            }

            // Update counts and flags for deciduous trees
            deciduousTrunkRef.current.count = deciduousTrunkIdx;
            goldFoliageRef.current.count = goldIdx;
            orangeFoliageRef.current.count = orangeIdx;
            redFoliageRef.current.count = redIdx;

            // Update counts for pine trees
            pineTrunkRef.current.count = pineTrunkIdx;
            pineFoliageRef.current.count = pineIdx;

            // Mark matrices as needing update
            if (deciduousTrunkRef.current.instanceMatrix) deciduousTrunkRef.current.instanceMatrix.needsUpdate = true;
            if (goldFoliageRef.current.instanceMatrix) goldFoliageRef.current.instanceMatrix.needsUpdate = true;
            if (orangeFoliageRef.current.instanceMatrix) orangeFoliageRef.current.instanceMatrix.needsUpdate = true;
            if (redFoliageRef.current.instanceMatrix) redFoliageRef.current.instanceMatrix.needsUpdate = true;
            if (pineTrunkRef.current.instanceMatrix) pineTrunkRef.current.instanceMatrix.needsUpdate = true;
            if (pineFoliageRef.current.instanceMatrix) pineFoliageRef.current.instanceMatrix.needsUpdate = true;

        } catch (e) {
            console.warn("Error generating vegetation:", e);
        }

    }, [chunkPosition, noise, count, roadMask]);

    return null;
}
