import { CylinderGeometry, SphereGeometry, MeshStandardMaterial, DoubleSide } from 'three';

// White birch bark material
export const birchBarkMaterial = new MeshStandardMaterial({
    color: '#f5f5f0',
    roughness: 0.9,
    metalness: 0.0,
});

// Autumn foliage materials
export const goldenFoliageMaterial = new MeshStandardMaterial({
    color: '#d4a52c',
    roughness: 0.8,
    side: DoubleSide,
});

export const orangeFoliageMaterial = new MeshStandardMaterial({
    color: '#c97a2c',
    roughness: 0.8,
    side: DoubleSide,
});

// Geometries
export const birchTrunkGeometry = new CylinderGeometry(0.15, 0.25, 8, 8);
export const birchFoliageGeometry = new SphereGeometry(2.5, 12, 8);
// Squash foliage vertically
birchFoliageGeometry.scale(1, 0.7, 1);
