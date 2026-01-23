import {
    CylinderGeometry,
    SphereGeometry,
    IcosahedronGeometry,
    ConeGeometry,
    MeshStandardMaterial,
    DoubleSide,
    BufferGeometry
} from 'three';
import { mergeBufferGeometries } from 'three-stdlib';

// ============================================
// MATERIALS
// ============================================

// White birch bark material
export const birchBarkMaterial = new MeshStandardMaterial({
    color: '#e8e8e0', // Slightly warmer white
    roughness: 0.9,
    metalness: 0.0,
});

// Autumn foliage materials - more realistic colors
export const goldenFoliageMaterial = new MeshStandardMaterial({
    color: '#d4a832', // Rich golden yellow
    roughness: 0.85,
    side: DoubleSide,
});

export const orangeFoliageMaterial = new MeshStandardMaterial({
    color: '#c45c26', // Deep autumn orange
    roughness: 0.85,
    side: DoubleSide,
});

export const redFoliageMaterial = new MeshStandardMaterial({
    color: '#9c3a2e', // Deep red for variety
    roughness: 0.85,
    side: DoubleSide,
});

// Pine tree materials
export const pineNeedleMaterial = new MeshStandardMaterial({
    color: '#2d5a3d', // Deep pine green
    roughness: 0.9,
    side: DoubleSide,
});

export const pineBarkMaterial = new MeshStandardMaterial({
    color: '#4a3728', // Dark brown bark
    roughness: 0.95,
    metalness: 0.0,
});

// ============================================
// GEOMETRIES - DECIDUOUS TREES (Birch/Aspen)
// ============================================

// Trunk geometry - properly grounded (base at y=0)
export const birchTrunkGeometry = new CylinderGeometry(0.12, 0.2, 6, 8);
birchTrunkGeometry.translate(0, 3, 0); // Center so bottom is at y=0

/**
 * Create organic-looking foliage cluster using multiple overlapping spheres
 * This replaces the flat ellipsoid that looked like a mushroom/umbrella
 */
function createDeciduousFoliageCluster(): BufferGeometry {
    const geometries: BufferGeometry[] = [];

    // Main central canopy - large icosahedron for organic look
    const mainCanopy = new IcosahedronGeometry(2.2, 1);
    mainCanopy.translate(0, 6.5, 0);
    geometries.push(mainCanopy);

    // Upper crown sphere
    const upperCrown = new SphereGeometry(1.5, 6, 5);
    upperCrown.translate(0, 8.2, 0);
    geometries.push(upperCrown);

    // Side clusters - 4 medium spheres around the main canopy
    const sidePositions = [
        { x: 1.3, y: 6.0, z: 0.5 },
        { x: -1.2, y: 5.8, z: -0.6 },
        { x: 0.4, y: 5.5, z: 1.4 },
        { x: -0.5, y: 6.2, z: -1.3 },
    ];

    for (const pos of sidePositions) {
        const sideSphere = new IcosahedronGeometry(1.3, 1);
        sideSphere.translate(pos.x, pos.y, pos.z);
        geometries.push(sideSphere);
    }

    // Lower drooping branches - smaller spheres
    const lowerPositions = [
        { x: 1.5, y: 4.5, z: 0.2 },
        { x: -1.4, y: 4.3, z: 0.3 },
        { x: 0.2, y: 4.0, z: 1.2 },
        { x: -0.3, y: 4.2, z: -1.1 },
    ];

    for (const pos of lowerPositions) {
        const lowerSphere = new SphereGeometry(0.9, 5, 4);
        lowerSphere.translate(pos.x, pos.y, pos.z);
        geometries.push(lowerSphere);
    }

    // Merge all spheres into one geometry
    const merged = mergeBufferGeometries(geometries);
    return merged || geometries[0];
}

// Export the foliage geometry
export const birchFoliageGeometry = createDeciduousFoliageCluster();

// ============================================
// GEOMETRIES - CONIFER TREES (Pine/Spruce)
// ============================================

// Pine trunk - taller and thinner
export const pineTrunkGeometry = new CylinderGeometry(0.15, 0.25, 8, 8);
pineTrunkGeometry.translate(0, 4, 0); // Base at y=0

/**
 * Create cone-based pine tree foliage (multiple stacked cones)
 */
function createPineFoliageCluster(): BufferGeometry {
    const geometries: BufferGeometry[] = [];

    // Bottom tier - largest cone
    const bottomCone = new ConeGeometry(2.5, 3, 8);
    bottomCone.translate(0, 5, 0);
    geometries.push(bottomCone);

    // Middle tier
    const middleCone = new ConeGeometry(2.0, 2.5, 8);
    middleCone.translate(0, 7, 0);
    geometries.push(middleCone);

    // Top tier - smallest cone
    const topCone = new ConeGeometry(1.3, 2, 8);
    topCone.translate(0, 8.8, 0);
    geometries.push(topCone);

    // Apex
    const apex = new ConeGeometry(0.6, 1.2, 6);
    apex.translate(0, 10.2, 0);
    geometries.push(apex);

    const merged = mergeBufferGeometries(geometries);
    return merged || geometries[0];
}

export const pineFoliageGeometry = createPineFoliageCluster();

// ============================================
// GEOMETRIES - BUSH / SHRUB
// ============================================

export const bushGeometry = new IcosahedronGeometry(1.0, 1);
bushGeometry.scale(1.2, 0.8, 1.2);
bushGeometry.translate(0, 0.6, 0); // Base near ground

export const bushMaterial = new MeshStandardMaterial({
    color: '#3d6b3d',
    roughness: 0.9,
    side: DoubleSide,
});

// ============================================
// HELPER: Create varied tree geometry based on type
// ============================================

export type TreeType = 'birch' | 'pine' | 'bush';

export function getTreeGeometries(type: TreeType): {
    trunk: BufferGeometry;
    foliage: BufferGeometry;
    trunkMaterial: MeshStandardMaterial;
    foliageMaterial: MeshStandardMaterial;
} {
    switch (type) {
        case 'pine':
            return {
                trunk: pineTrunkGeometry,
                foliage: pineFoliageGeometry,
                trunkMaterial: pineBarkMaterial,
                foliageMaterial: pineNeedleMaterial,
            };
        case 'bush':
            return {
                trunk: new BufferGeometry(), // No trunk for bush
                foliage: bushGeometry,
                trunkMaterial: bushMaterial,
                foliageMaterial: bushMaterial,
            };
        case 'birch':
        default:
            return {
                trunk: birchTrunkGeometry,
                foliage: birchFoliageGeometry,
                trunkMaterial: birchBarkMaterial,
                foliageMaterial: goldenFoliageMaterial,
            };
    }
}
