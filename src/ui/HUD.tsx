import { useGameStore } from '../stores/gameStore';
import { FreeLookButton } from './FreeLookButton';
import { MiniMap } from './MiniMap';

export function HUD() {
    const speed = useGameStore(state => state.speed);
    const distance = useGameStore(state => state.distance);

    // Convert speed to km/h (approx 3.6 conversion from m/s)
    const displaySpeed = Math.round(speed * 3.6);
    const displayDistance = (distance / 1000).toFixed(1);

    return (
        <>
            {/* Free Look Button */}
            <FreeLookButton />

            {/* Mini Map */}
            <MiniMap />

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
                        Right-Click + Drag: Rotate Camera • Scroll: Zoom • Middle-Click: Reset Camera
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
