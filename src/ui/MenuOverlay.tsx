import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { VehicleSelect } from './VehicleSelect';

export function MenuOverlay() {
    const { isPaused, setIsPaused } = useGameStore();
    const [view, setView] = useState<'main' | 'garage'>('main');

    // Create a local state to track if game has started initially?
    // For now, let's assume game starts paused or we use isPaused as "Menu Open"

    if (!isPaused) return null;

    if (view === 'garage') {
        return (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
                <VehicleSelect />
                <button
                    onClick={() => setView('main')}
                    className="mt-8 px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-50 uppercase text-sm tracking-widest font-bold"
                >
                    Back to Menu
                </button>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
            <div className="text-center text-white max-w-md p-8 border border-white/20 bg-black/40 rounded-xl shadow-2xl">
                <h1 className="text-5xl font-black mb-2 tracking-tighter italic">
                    SLOW ROADS
                </h1>
                <p className="text-lg opacity-80 mb-8 font-light">
                    Endless driving zen.
                </p>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => setIsPaused(false)}
                        className="px-8 py-3 bg-white text-black font-bold text-lg rounded-full hover:bg-slate-200 transition-colors uppercase tracking-wider"
                    >
                        Resume Driving
                    </button>

                    <button
                        onClick={() => setView('garage')}
                        className="px-8 py-3 bg-transparent border-2 border-white/30 text-white font-bold text-lg rounded-full hover:bg-white/10 hover:border-white transition-colors uppercase tracking-wider"
                    >
                        Garage
                    </button>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 text-sm opacity-50 text-left">
                    <div>
                        <span className="font-bold block">Steer</span>
                        WASD / Arrows
                    </div>
                    <div>
                        <span className="font-bold block">Brake</span>
                        Spacebar
                    </div>
                    <div>
                        <span className="font-bold block">Reset</span>
                        R Key
                    </div>
                </div>
            </div>
        </div>
    );
}
