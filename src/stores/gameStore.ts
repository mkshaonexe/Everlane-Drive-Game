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

export interface MapConfig {
    id: string;
    name: string;
    description: string;
    type: 'procedural' | 'gltf';
    path?: string;
    scale?: number;
    rotationOffset?: [number, number, number];
    positionOffset?: [number, number, number];
    thumbnail?: string; // Optional thumbnail image URL
    spawnPosition?: [number, number, number];
    fogColor?: string;
    fogNear?: number;
    fogFar?: number;
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
        id: 'factory_sports',
        name: 'Factory Sports',
        description: 'Burnout Dominator Factory Sports. Raw power meets precision.',
        type: 'gltf',
        path: '/models/cars/factory_sports_burnout_dominator/scene.gltf',
        scale: 0.55,
        rotationOffset: [0, 0, 0],
        positionOffset: [0, -0.3, 0]
    },
    {
        id: 'tokyo_drift',
        name: 'Drift King',
        description: '1997 Tokyo Drift Legend. High slip angle.',
        type: 'gltf',
        path: '/models/cars/1997_tokyo_drift/scene.gltf',
        scale: 44, // Proportional scaling: 120 * (0.55 / 1.5) = 44
        rotationOffset: [0, 0, 0], // Face forward (net 180 deg with component rotation)
        positionOffset: [0, -0.1, 0] // Lower to reduce gap
    },
    {
        id: 'mcqueen',
        name: 'Lightning',
        description: 'Speed. I am speed.',
        type: 'gltf',
        path: '/models/cars/lightning_mcqueen_cars_3/scene.gltf',
        scale: 0.55,
        rotationOffset: [0, 0, 0],
        positionOffset: [0, -0.6, 0]
    },
    {
        id: 'mcqueen_black',
        name: 'Storm',
        description: 'Next gen speed.',
        type: 'gltf',
        path: '/models/cars/mcqueenbalcjkm/scene.gltf',
        scale: 0.55, // Reduced from 1.5 to 0.55
        rotationOffset: [0, 0, 0], // Face forward (net 180 deg with component rotation)
        positionOffset: [0, -0.6, 0] // Same as Lightning
    },
    {
        id: 'milano_95',
        name: 'Milano 95',
        description: 'Milano 95 Racemod. Agile sports coupe built for precision racing.',
        type: 'gltf',
        path: '/models/cars/milano_95_racemod_-_low_poly_model/scene.gltf',
        scale: 0.55,
        rotationOffset: [0, -Math.PI / 2, 0],
        positionOffset: [0, -0.3, 0]
    }
];

export const MAPS: MapConfig[] = [
    {
        id: 'procedural',
        name: 'Everlane Highway',
        description: 'Infinite procedurally generated highway. Drive forever through dynamic terrain.',
        type: 'procedural',
        fogColor: '#e5dbc1',
        fogNear: 20,
        fogFar: 300,
        spawnPosition: [0, 5, 50],
    },
    {
        id: 'tuscan_view',
        name: 'Tuscan Vista',
        description: 'Burnout Dominator Tuscan View. Sun-baked Italian roads with sweeping landscapes.',
        type: 'gltf',
        path: '/models/maps/burnout_dominator_tuscan_view/scene.gltf',
        scale: 25, // Scaled up to make the road width correct for the cars
        rotationOffset: [0, 0, 0],
        positionOffset: [0, 0, 0],
        fogColor: '#c8b99a',
        fogNear: 50,
        fogFar: 500,
        spawnPosition: [-79.2, 38, 34.2], // Adjusted spawn height to match scaled town
    },
    {
        id: 'drift_track',
        name: 'Drift Track',
        description: 'Nicholas-3D Drift Race Track. Perfect for high-speed slides and tight corners.',
        type: 'gltf',
        path: '/models/maps/drift_race_track_free/scene.gltf',
        scale: 0.3,
        rotationOffset: [0, 0, 0],
        positionOffset: [0, 0, 0],
        fogColor: '#a3c2c4',
        fogNear: 15,
        fogFar: 150,
        spawnPosition: [0, 1.5, 0],
    },
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
    cameraPresetIndex: number;
    cycleCameraPreset: () => void;

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

    // Map Selection
    selectedMap: string;
    setSelectedMap: (id: string) => void;
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
    cameraPresetIndex: 0,

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

    cycleCameraPreset: () => set((state) => {
        const CAMERA_PRESETS = [
            { distance: 8, pitch: 0.1, yaw: 0 },       // Chase (Default)
            { distance: 14, pitch: 0.25, yaw: 0 },     // Action / Far
            { distance: 3.5, pitch: 0.05, yaw: 0 },    // Near / Bumper
            { distance: 20, pitch: 0.8, yaw: 0 }       // Birds Eye
        ];
        const nextIndex = (state.cameraPresetIndex + 1) % CAMERA_PRESETS.length;
        const preset = CAMERA_PRESETS[nextIndex];
        return {
            cameraPresetIndex: nextIndex,
            cameraDistance: preset.distance,
            freeLookPitch: preset.pitch,
            freeLookYaw: preset.yaw
        };
    }),

    // Road Data Actions
    setRoadPath: (path) => set({ roadPath: path }),

    // Audio State
    isMuted: false,
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    setMute: (muted: boolean) => set({ isMuted: muted }),

    // Vehicle Selection
    selectedVehicle: 'factory_sports', // Default to Factory Sports Burnout Dominator
    setSelectedVehicle: (id: string) => set({ selectedVehicle: id }),

    // Map Selection
    selectedMap: 'tuscan_view', // Default to Tuscan View map
    setSelectedMap: (id: string) => set({ selectedMap: id }),
}));

// Expose store for debugging and browser automation
if (typeof window !== 'undefined') {
    (window as any).useGameStore = useGameStore;
}
