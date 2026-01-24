import { create } from 'zustand';
import { Vector3 } from 'three';

export interface VehicleConfig {
    id: string;
    name: string;
    description: string;
    type: 'procedural' | 'gltf';
    path?: string; // Path to GLTF/GLB
    scale?: number;
    rotationOffset?: [number, number, number];
    positionOffset?: [number, number, number];
}

export const VEHICLES: VehicleConfig[] = [
    {
        id: 'standard',
        name: 'Standard EV',
        description: 'Balanced performance, reliable handling.',
        type: 'procedural',
        positionOffset: [0, -0.2, 0] // Fix floating
    },
    {
        id: 'tokyo_drift',
        name: 'Drift King',
        description: '1997 Tokyo Drift Legend. High slip angle.',
        type: 'gltf',
        path: '/models/cars/1997_tokyo_drift/scene.gltf',
        scale: 120, // Model has 0.01 internal scale, so 1.2 -> 120
        rotationOffset: [0, Math.PI, 0], // Face forward direction
        positionOffset: [0, -0.1, 0] // Lower to reduce gap
    },
    {
        id: 'mcqueen',
        name: 'Lightning',
        description: 'Speed. I am speed.',
        type: 'gltf',
        path: '/models/cars/lightning_mcqueen_cars_3/scene.gltf',
        scale: 1.5,
        rotationOffset: [0, Math.PI, 0],
        positionOffset: [0, -0.6, 0]
    },
    {
        id: 'mcqueen_black',
        name: 'Storm',
        description: 'Next gen speed.',
        type: 'gltf',
        path: '/models/cars/mcqueenbalcjkm/scene.gltf',
        scale: 1.5, // Reduced from 80 to 1.5 based on user feedback
        rotationOffset: [0, Math.PI, 0], // Face forward direction  
        positionOffset: [0, -0.6, 0] // Same as Lightning
    }
];

interface GameState {
    speed: number;
    distance: number;
    isPaused: boolean;
    showFps: boolean;
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
    toggleShowFps: () => void;
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

    // Audio State
    isMuted: boolean;
    toggleMute: () => void;
    setMute: (isMuted: boolean) => void;

    // Vehicle Selection
    selectedVehicle: string;
    setSelectedVehicle: (id: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
    speed: 0,
    distance: 0,
    isPaused: true, // Start paused to show menu
    showFps: true,
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
    toggleShowFps: () => set((state) => ({ showFps: !state.showFps })),
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

    // Audio State
    isMuted: false,
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    setMute: (muted: boolean) => set({ isMuted: muted }),

    // Vehicle Selection
    selectedVehicle: 'standard', // 'standard', 'sport', 'offroad'
    setSelectedVehicle: (id: string) => set({ selectedVehicle: id }),
}));
