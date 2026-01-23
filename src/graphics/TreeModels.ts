import { CylinderGeometry, SphereGeometry, MeshStandardMaterial, DoubleSide } from 'three';

// White birch bark material
export const birchBarkMaterial = new MeshStandardMaterial({
    color: '#f5f5f0',
    roughness: 0.9,
    metalness: 0.0,
});

// Autumn foliage materials
export const goldenFoliageMaterial = new MeshStandardMaterial({
    color: '#e6b83a', // Brighter gold
    roughness: 0.8,
    side: DoubleSide,
});

export const orangeFoliageMaterial = new MeshStandardMaterial({
    color: '#e68a2e', // Brighter orange
    roughness: 0.8,
    side: DoubleSide,
});

// Geometries
export const birchTrunkGeometry = new CylinderGeometry(0.15, 0.25, 8, 8);
export const birchFoliageGeometry = new SphereGeometry(2.5, 12, 8);
// Squash foliage vertically for natural look
birchFoliageGeometry.scale(1, 0.7, 1);
