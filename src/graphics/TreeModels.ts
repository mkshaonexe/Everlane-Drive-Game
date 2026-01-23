import {
    CylinderGeometry,
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

// ============================================
// GEOMETRIES - DECIDUOUS TREES (Birch/Aspen)
// ============================================

// Trunk geometry - properly grounded (base at y=0)
const birchTrunkBase = new CylinderGeometry(0.12, 0.25, 6, 7);
birchTrunkBase.translate(0, 3, 0); // Center so bottom is at y=0

// Add root flare
const birchRoots = new ConeGeometry(0.5, 1.0, 7);
birchRoots.translate(0, 0.5, 0);
// Merge logic will handle this if we were merging, but here we are exporting a single geometry.
// Let's create a specific merged trunk geometry
export const birchTrunkGeometry = mergeBufferGeometries([birchTrunkBase, birchRoots]) as BufferGeometry;


/**
 * Create organic-looking foliage cluster using cones and irregular shapes
 * Replaces the "lollipop" sphere look
 */
function createDeciduousFoliageCluster(): BufferGeometry {
    const geometries: BufferGeometry[] = [];

    // Use low-poly icosahedrons but scaled/rotated to look like leaf clusters
    // Main central mass
    const mainMass = new IcosahedronGeometry(1.8, 0); // Low poly
    mainMass.scale(1, 0.8, 1);
    mainMass.rotateY(Math.random() * Math.PI);
    mainMass.translate(0, 6.0, 0);
    geometries.push(mainMass);

    // Add several "sub-clusters" to break the silhouette
    const positions = [
        { x: 1.0, y: 7.0, z: 0.5, s: 0.8 },
        { x: -1.0, y: 6.5, z: -0.5, s: 0.9 },
        { x: 0.0, y: 8.0, z: 0.0, s: 0.7 }, // Top
        { x: 0.5, y: 5.5, z: 1.2, s: 0.7 },
        { x: -0.5, y: 6.0, z: -1.0, s: 0.7 },
    ];

    for (const pos of positions) {
        // Mix of Icos and Cones for variety
        const geo = new IcosahedronGeometry(1.5 * pos.s, 0);
        geo.scale(1, 0.7, 1);
        geo.rotateX(Math.random());
        geo.rotateZ(Math.random());
        geo.translate(pos.x, pos.y, pos.z);
        geometries.push(geo);
    }

    // Merge all
    const merged = mergeBufferGeometries(geometries);
    return merged || geometries[0];
}

// Export the foliage geometry
export const birchFoliageGeometry = createDeciduousFoliageCluster();

// ============================================
// GEOMETRIES - CONIFER TREES (Pine/Spruce)
// ============================================

// Pine trunk - taller and thinner
const pineTrunkBase = new CylinderGeometry(0.15, 0.35, 8, 7);
pineTrunkBase.translate(0, 4, 0); // Base at y=0
// Add roots
const pineRoots = new ConeGeometry(0.7, 1.2, 7);
pineRoots.translate(0, 0.6, 0);
export const pineTrunkGeometry = mergeBufferGeometries([pineTrunkBase, pineRoots]) as BufferGeometry;


/**
 * Create cone-based pine tree foliage (multiple stacked cones)
 */
function createPineFoliageCluster(): BufferGeometry {
    const geometries: BufferGeometry[] = [];

    // 4 Tiers for better look
    const tiers = [
        { y: 4.5, r: 2.8, h: 3.5 }, // Bottom
        { y: 6.5, r: 2.3, h: 3.0 },
        { y: 8.5, r: 1.6, h: 2.5 },
        { y: 10.2, r: 0.8, h: 1.8 } // Top
    ];

    for (const tier of tiers) {
        // Use 7 segments for low poly look
        const cone = new ConeGeometry(tier.r, tier.h, 7);
        cone.translate(0, tier.y, 0);
        geometries.push(cone);

        // Add a second slightly offset cone to make it dense/irregular
        const coneInner = new ConeGeometry(tier.r * 0.8, tier.h, 7);
        coneInner.rotateY(0.4); // Offset rotation
        coneInner.translate(0, tier.y, 0);
        geometries.push(coneInner);
    }

    const merged = mergeBufferGeometries(geometries);
    return merged || geometries[0];
}

export const pineFoliageGeometry = createPineFoliageCluster();

// ============================================
// GEOMETRIES - BUSH / SHRUB
// ============================================

export const bushGeometry = new IcosahedronGeometry(0.8, 0); // Low poly
bushGeometry.scale(1.5, 0.7, 1.5);
bushGeometry.translate(0, 0.5, 0); // Base near ground
// Add detail lumps
const bushLump1 = new IcosahedronGeometry(0.5, 0);
bushLump1.translate(0.6, 0.6, 0.2);
const bushLump2 = new IcosahedronGeometry(0.5, 0);
bushLump2.translate(-0.5, 0.5, -0.4);

// Merge bush
const bushMerged = mergeBufferGeometries([bushGeometry, bushLump1, bushLump2]) as BufferGeometry;

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
                trunk: pineTrunkGeometry, // Now this IS the merged one
                foliage: pineFoliageGeometry,
                trunkMaterial: pineBarkMaterial,
                foliageMaterial: pineNeedleMaterial,
            };
        case 'bush':
            return {
                trunk: new BufferGeometry(), // No trunk for bush
                foliage: bushMerged,
                trunkMaterial: bushMaterial,
                foliageMaterial: bushMaterial,
            };
        case 'birch':
        default:
            return {
                trunk: birchTrunkGeometry, // Now this IS the merged one
                foliage: birchFoliageGeometry,
                trunkMaterial: birchBarkMaterial,
                foliageMaterial: goldenFoliageMaterial,
            };
    }
}
