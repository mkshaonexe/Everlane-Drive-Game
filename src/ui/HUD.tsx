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
            {/* Top Left Controls */}
            <div className="absolute top-6 left-6 flex items-center gap-3 z-50 pointer-events-auto">
                <button
                    onClick={toggleMute}
                    className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all hover:scale-110 shadow-lg group ${isMuted ? 'bg-red-500/50 text-white' : 'bg-black/40 text-white/80 hover:bg-black/60'
                        }`}
                    title={isMuted ? "Unmute Audio" : "Mute Audio"}
                >
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110 shadow-lg"
                    title="Open Settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
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
                    className="absolute top-2 left-1/2 -translate-x-1/2 text-green-400 font-mono font-bold text-xs z-50 pointer-events-none drop-shadow-md bg-black/60 px-2 py-0.5 rounded-full border border-white/10"
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
