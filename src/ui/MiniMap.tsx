import { useRef, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

export function MiniMap() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const position = useGameStore(state => state.position);
    const roadPath = useGameStore(state => state.roadPath);

    // We need vehicle rotation for Track Up. 
    // Let's update Vehicle.tsx to set rotation in store, OR just use North Up.
    // User asked for "show the road nearest road and the car its my slef current location".
    // North Up is acceptable for a simple mini-map.

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Map settings
        const mapSize = 200; // px
        const viewRange = 300; // meters visible
        const scale = mapSize / viewRange; // pixels per center
        const centerX = mapSize / 2;
        const centerY = mapSize / 2;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, mapSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Save context for clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, mapSize / 2, 0, Math.PI * 2);
        ctx.clip();

        // Draw Road
        if (roadPath && roadPath.length > 0) {
            ctx.strokeStyle = '#AAAAAA';
            ctx.lineWidth = 15 * scale; // Road width approx 12m
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();

            // Optimization: only draw points within range
            let first = true;

            for (let i = 0; i < roadPath.length; i++) {
                const p = roadPath[i];
                // Convert world pos (x, z) to map pos relative to vehicle
                // Vehicle is at center (centerX, centerY)
                // World coordinates: X is right, Z is forward/back?
                // In Three.js: X is Right, Y is Up, Z is Forward/Backward (usually +Z is towards camera/back)

                // Map coordinates: x right, y down.
                // If North Up (World -Z is Up on map? or +Z up?)
                // Let's say Map Up is World -Z.

                const dx = p.x - position.x;
                const dz = p.z - position.z;

                // Check if roughly in range (with buffer)
                if (Math.abs(dx) > viewRange && Math.abs(dz) > viewRange) continue;

                const mapX = centerX + dx * scale;
                const mapY = centerY + dz * scale; // World +Z is down on screen (standard map)

                if (first) {
                    ctx.moveTo(mapX, mapY);
                    first = false;
                } else {
                    ctx.lineTo(mapX, mapY);
                }
            }
            ctx.stroke();

            // Draw center line
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1 * scale;
            ctx.setLineDash([10 * scale, 10 * scale]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw Player (Center)
        ctx.translate(centerX, centerY);
        // If we had rotation we would rotate the arrow here.
        // Since North Up, we rotate the arrow by vehicle rotation?
        // If map is North Up, vehicle arrow points in vehicle direction.

        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(5, 5);
        ctx.lineTo(0, 2);
        ctx.lineTo(-5, 5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

    }, [position, roadPath]); // Update on position change

    return (
        <div className="absolute top-8 left-8 pointer-events-none select-none">
            <canvas
                ref={canvasRef}
                width={200}
                height={200}
                className="rounded-full border-2 border-white/20 shadow-lg backdrop-blur-sm"
            />
            <div className="absolute -bottom-6 w-full text-center text-xs font-bold text-white/70 uppercase tracking-widest">
                Map
            </div>
        </div>
    );
}
