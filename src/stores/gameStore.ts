import { create } from 'zustand';
import { Vector3 } from 'three';

interface GameState {
    speed: number;
    distance: number;
    isPaused: boolean;
    position: Vector3;

    // Free Look Camera State
    isFreeLookActive: boolean;
    isFreeLookButtonActive: boolean; // Toggle button state
    freeLookYaw: number;
    freeLookPitch: number;

    // Camera Zoom State
    cameraDistance: number;

    setSpeed: (speed: number) => void;
    addDistance: (delta: number) => void;
    setIsPaused: (isPaused: boolean) => void;
    togglePause: () => void;
    setPosition: (position: Vector3) => void;

    // Free Look Actions
    setFreeLookActive: (active: boolean) => void;
    toggleFreeLookButton: () => void;
    updateFreeLookAngles: (deltaYaw: number, deltaPitch: number) => void;
    resetFreeLookAngles: () => void;

    // Camera Zoom Actions
    updateCameraZoom: (delta: number) => void;

    // Road Data (for MiniMap & Respawn)
    roadPath: Vector3[];
    setRoadPath: (path: Vector3[]) => void;
}

export const useGameStore = create<GameState>((set) => ({
    speed: 0,
    distance: 0,
    isPaused: true, // Start paused to show menu
    position: new Vector3(0, 0, 0),

    // Free Look Initial State
    isFreeLookActive: false,
    isFreeLookButtonActive: false,
    freeLookYaw: 0,
    freeLookPitch: 0,

    // Camera Zoom Initial State (default distance from vehicle)
    cameraDistance: 8,

    // Road Data Initial State
    roadPath: [],

    setSpeed: (speed) => set({ speed }),
    addDistance: (delta) => set((state) => ({ distance: state.distance + delta })),
    setIsPaused: (isPaused) => set({ isPaused }),
    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
    setPosition: (position) => set({ position }),

    // Free Look Actions
    setFreeLookActive: (active) => set({ isFreeLookActive: active }),
    toggleFreeLookButton: () => set((state) => ({
        isFreeLookButtonActive: !state.isFreeLookButtonActive,
        // Don't auto-activate free look - still need right-click to rotate
        // Reset angles when toggling off the button
        freeLookYaw: state.isFreeLookButtonActive ? 0 : state.freeLookYaw,
        freeLookPitch: state.isFreeLookButtonActive ? 0 : state.freeLookPitch,
    })),
    updateFreeLookAngles: (deltaYaw, deltaPitch) => set((state) => ({
        freeLookYaw: state.freeLookYaw + deltaYaw,
        // Clamp pitch to avoid flipping (-60 to 60 degrees)
        freeLookPitch: Math.max(-Math.PI / 3, Math.min(Math.PI / 3, state.freeLookPitch + deltaPitch)),
    })),
    resetFreeLookAngles: () => set({ freeLookYaw: 0, freeLookPitch: 0 }),

    // Camera Zoom Actions
    updateCameraZoom: (delta) => set((state) => ({
        // Clamp zoom distance between 3 and 50 units (increased range)
        cameraDistance: Math.max(3, Math.min(50, state.cameraDistance + delta)),
    })),

    // Road Data Actions
    setRoadPath: (path) => set({ roadPath: path }),
}));
