import { create } from 'zustand';
import { Vector3 } from 'three';

interface GameState {
    speed: number;
    distance: number;
    isPaused: boolean;
    position: Vector3;

    setSpeed: (speed: number) => void;
    addDistance: (delta: number) => void;
    setIsPaused: (isPaused: boolean) => void;
    togglePause: () => void;
    setPosition: (position: Vector3) => void;
}

export const useGameStore = create<GameState>((set) => ({
    speed: 0,
    distance: 0,
    isPaused: true, // Start paused to show menu
    position: new Vector3(0, 0, 0),

    setSpeed: (speed) => set({ speed }),
    addDistance: (delta) => set((state) => ({ distance: state.distance + delta })),
    setIsPaused: (isPaused) => set({ isPaused }),
    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
    setPosition: (position) => set({ position }),
}));
