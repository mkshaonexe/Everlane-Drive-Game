import { useGameStore } from '../stores/gameStore';

export function MenuOverlay() {
    const { isPaused, setIsPaused } = useGameStore();

    // Create a local state to track if game has started initially?
    // For now, let's assume game starts paused or we use isPaused as "Menu Open"

    if (!isPaused) return null;

    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center text-white max-w-md p-8 border border-white/20 bg-black/40 rounded-xl shadow-2xl">
                <h1 className="text-5xl font-black mb-2 tracking-tighter italic">
                    SLOW ROADS
                </h1>
                <p className="text-lg opacity-80 mb-8 font-light">
                    Endless driving zen.
                </p>

                <button
                    onClick={() => setIsPaused(false)}
                    className="px-8 py-3 bg-white text-black font-bold text-lg rounded-full hover:bg-slate-200 transition-colors uppercase tracking-wider"
                >
                    Resume Driving
                </button>

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
