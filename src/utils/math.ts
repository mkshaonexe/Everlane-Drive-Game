import { Vector3 } from 'three';

export const lerp = (start: number, end: number, t: number): number => {
    return start + (end - start) * t;
};

export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

export const mapRange = (
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
): number => {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

export const distance2D = (v1: Vector3, v2: Vector3): number => {
    const dx = v1.x - v2.x;
    const dz = v1.z - v2.z;
    return Math.sqrt(dx * dx + dz * dz);
};

export const degToRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
};

export const radToDeg = (radians: number): number => {
    return radians * (180 / Math.PI);
};
