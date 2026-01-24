import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { FreeLookButton } from './FreeLookButton';
import { MiniMap } from './MiniMap';
import { SettingsMenu } from './SettingsMenu';

export function HUD() {
    const speed = useGameStore(state => state.speed);
    const distance = useGameStore(state => state.distance);
    const isMuted = useGameStore(state => state.isMuted);
    const toggleMute = useGameStore(state => state.toggleMute);
    const showFps = useGameStore(state => state.showFps);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // FPS Counter Logic
    const fpsRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        let frameCount = 0;
        let lastTime = performance.now();
        let animationFrameId: number;

        const loop = () => {
            const time = performance.now();
            frameCount++;

            if (time - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (time - lastTime));
                if (fpsRef.current) {
                    fpsRef.current.innerText = `${fps} FPS`;
                }
                frameCount = 0;
                lastTime = time;
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Convert speed to km/h (approx 3.6 conversion from m/s)
    const displaySpeed = Math.round(speed * 3.6);
    const displayDistance = (distance / 1000).toFixed(1);

    return (
        <>
            {/* Top Right Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-3 z-50 pointer-events-auto">
                <button
                    onClick={toggleMute}
                    className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all hover:scale-110 shadow-lg ${isMuted ? 'bg-red-500/50 text-white' : 'bg-black/40 text-white/80 hover:bg-black/60'
                        }`}
                    title={isMuted ? "Unmute Audio" : "Mute Audio"}
                >
                    {isMuted ? '🔇' : '🔊'}
                </button>

                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110 shadow-lg"
                    title="Open Settings"
                >
                    <span className="text-xl">⚙️</span>
                </button>
            </div>

            {/* Settings Menu Modal */}
            {isSettingsOpen && (
                <SettingsMenu onClose={() => setIsSettingsOpen(false)} />
            )}

            {/* Free Look Button */}
            <FreeLookButton />

            {/* Mini Map */}
            <MiniMap />

            {/* FPS Counter */}
            {showFps && (
                <div
                    ref={fpsRef}
                    className="absolute top-16 left-4 text-green-400 font-mono font-bold text-lg z-50 pointer-events-none drop-shadow-md bg-black/50 px-2 py-1 rounded"
                >
                    -- FPS
                </div>
            )}

            <div className="absolute inset-x-0 bottom-0 p-8 pointer-events-none select-none flex justify-between items-end bg-gradient-to-t from-black/50 to-transparent">
                {/* Speedometer */}
                <div className="flex flex-col items-start gap-1">
                    <div className="text-6xl font-bold font-mono text-white tracking-tighter">
                        {displaySpeed}
                    </div>
                    <div className="text-sm font-bold text-white/70 uppercase tracking-widest pl-1">
                        km/h
                    </div>
                </div>

                {/* Center Info / Controls Hint */}
                <div className="flex flex-col items-center gap-2 mb-2 opacity-50">
                    <div className="text-xs text-white/80 uppercase tracking-wider">
                        WASD to Drive • SPACE to Brake
                    </div>
                    <div className="text-xs text-white/60 uppercase tracking-wider">
                        Click + Drag: Rotate Camera • Scroll: Zoom • Middle-Click: Reset Camera
                    </div>
                </div>

                {/* Distance / Odometer */}
                <div className="flex flex-col items-end gap-1">
                    <div className="text-4xl font-bold font-mono text-white tracking-tight">
                        {displayDistance}
                    </div>
                    <div className="text-sm font-bold text-white/70 uppercase tracking-widest pr-1">
                        km total
                    </div>
                </div>
            </div>
        </>
    );
}
