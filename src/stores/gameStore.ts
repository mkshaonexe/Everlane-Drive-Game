import { create } from 'zustand';

interface GameState {
    speed: number;
    distance: number;
    isPaused: boolean;

    setSpeed: (speed: number) => void;
    addDistance: (delta: number) => void;
    setIsPaused: (isPaused: boolean) => void;
    togglePause: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    speed: 0,
    distance: 0,
    isPaused: true, // Start paused to show menu

    setSpeed: (speed) => set({ speed }),
    addDistance: (delta) => set((state) => ({ distance: state.distance + delta })),
    setIsPaused: (isPaused) => set({ isPaused }),
    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
}));
