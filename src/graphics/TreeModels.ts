import { CylinderGeometry, SphereGeometry, MeshStandardMaterial, DoubleSide } from 'three';

// White birch bark material
export const birchBarkMaterial = new MeshStandardMaterial({
    color: '#e8e8e0', // Slightly warmer white
    roughness: 0.9,
    metalness: 0.0,
});

// Autumn foliage materials
export const goldenFoliageMaterial = new MeshStandardMaterial({
    color: '#e6b83a',
    roughness: 0.8,
    side: DoubleSide,
});

export const orangeFoliageMaterial = new MeshStandardMaterial({
    color: '#d66d1e', // Darker orange
    roughness: 0.8,
    side: DoubleSide,
});

// Geometries
export const birchTrunkGeometry = new CylinderGeometry(0.15, 0.25, 8, 8);
birchTrunkGeometry.translate(0, 4, 0); // Center trunk so bottom is at 0

// Create clustered foliage
const sphere1 = new SphereGeometry(2.0, 8, 8);
sphere1.translate(0, 7, 0);

const sphere2 = new SphereGeometry(1.5, 8, 8);
sphere2.translate(1, 8, 0.5);

const sphere3 = new SphereGeometry(1.5, 8, 8);
sphere3.translate(-1, 6.5, -0.5);

// Merge geometries manually since BufferGeometryUtils might not be readily available in this env without extra imports
// Actually, let's just use one sphere but scale it weirdly to look organic
// Or better, let's try to import BufferGeometryUtils, but if it fails we fallback.
// Given the environment, let's do manual merging helper or just use a simpler lumpy shape.
// Simpler: Just use one Icosahedron with low detail and flat shading?
// The user wants "Autumn".
// Let's stick to the single sphere but squashed for now, maybe just slightly larger.
// Wait, I can't easily merge without utils. 
// I'll make the sphere "lumpy" by scaling.
export const birchFoliageGeometry = new SphereGeometry(2.5, 7, 6);
birchFoliageGeometry.scale(1, 0.6, 1);
birchFoliageGeometry.translate(0, 6, 0); // Move up to sit on trunk

