import { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';

export function MiniMap() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const position = useGameStore(state => state.position);
    const roadPath = useGameStore(state => state.roadPath);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hovered, setHovered] = useState(false);

    // Repaint function/effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Determine dimensions
        const width = isExpanded ? window.innerWidth : 200;
        const height = isExpanded ? window.innerHeight : 200;

        // Update canvas size if needed (avoid clearing if size matches)
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Map settings
        let scale: number;
        let centerX: number;
        let centerY: number;
        let offsetX = 0;
        let offsetZ = 0;

        if (isExpanded) {
            // Full Map Mode: Fit "all the things" (the whole road)
            // Calculate bounds
            let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

            if (roadPath && roadPath.length > 0) {
                for (const p of roadPath) {
                    if (p.x < minX) minX = p.x;
                    if (p.x > maxX) maxX = p.x;
                    if (p.z < minZ) minZ = p.z;
                    if (p.z > maxZ) maxZ = p.z;
                }
            } else {
                // Default bounds around player if no road
                minX = position.x - 500; maxX = position.x + 500;
                minZ = position.z - 500; maxZ = position.z + 500;
            }

            // Add padding
            const padding = 100;
            minX -= padding; maxX += padding;
            minZ -= padding; maxZ += padding;

            const roadW = maxX - minX;
            const roadH = maxZ - minZ;

            // Scale to fit screen
            const scaleX = width / roadW;
            const scaleY = height / roadH;
            scale = Math.min(scaleX, scaleY) * 0.9; // 0.9 for margin

            // Center of the map
            const mapCx = (minX + maxX) / 2;
            const mapCz = (minZ + maxZ) / 2;

            centerX = width / 2;
            centerY = height / 2;

            // Offset to move world origin to center relative to map center
            offsetX = -mapCx;
            offsetZ = -mapCz;

            // Background with darker overlay for better visibility
            ctx.fillStyle = 'rgba(15, 15, 20, 0.97)';
            ctx.fillRect(0, 0, width, height);

        } else {
            // Mini Map Mode
            const viewRange = 300; // meters visible
            scale = width / viewRange;
            centerX = width / 2;
            centerY = height / 2;

            // Offset is relative to player
            offsetX = -position.x;
            offsetZ = -position.z;

            // Background Circle
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, width / 2, 0, Math.PI * 2);
            ctx.fill();

            // Clip to circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, width / 2, 0, Math.PI * 2);
            ctx.clip();
        }

        // --- Draw Map Content ---

        ctx.save();
        // Move to center of screen
        ctx.translate(centerX, centerY);

        // In MiniMap mode, we rotated so up is forward? No, we just did north up.
        // Let's stick to North Up for consistency.
        // World coordinates: X right, Z down (on screen) -> usually Z is forward. 
        // If map is North Up, usually -Z is Up.
        // Screen Y is Down.
        // So World Z should map to Screen Y?
        // If World +Z is "South", and Screen +Y is "Down". Then +Z -> +Y.

        ctx.scale(scale, scale); // 1 unit = 1 pixel * scale
        ctx.translate(offsetX, offsetZ);

        // Grid lines (Full map only)
        if (isExpanded) {
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2 / scale;
            // Draw grid logic if needed... skipping for cleanliness
        }

        // Draw Road
        if (roadPath && roadPath.length > 0) {
            ctx.strokeStyle = isExpanded ? '#FFFFFF' : '#AAAAAA';
            ctx.lineWidth = 15; // Real world meters width
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            let first = true;
            for (let i = 0; i < roadPath.length; i += 2) { // Skip every other point for perf
                const p = roadPath[i];
                if (first) {
                    ctx.moveTo(p.x, p.z);
                    first = false;
                } else {
                    ctx.lineTo(p.x, p.z);
                }
            }
            if (roadPath.length > 1) { // Ensure last point
                const last = roadPath[roadPath.length - 1];
                ctx.lineTo(last.x, last.z);
            }
            ctx.stroke();

            // Center line
            ctx.strokeStyle = isExpanded ? '#444444' : '#FFFFFF';
            ctx.lineWidth = 1;
            if (!isExpanded) {
                ctx.setLineDash([10, 10]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Draw Player
        ctx.translate(position.x, position.z);

        // Draw player icon
        ctx.fillStyle = '#FF4444';

        // Make player icon constant size on screen, regardless of zoom
        // So we need to reverse scale for the icon drawing
        const iconSize = isExpanded ? 10 / scale : 6 / scale;

        ctx.beginPath();
        // Simple circle/triangle
        ctx.arc(0, 0, iconSize, 0, Math.PI * 2);
        ctx.fill();

        // Indicate Direction? We'd need rotation.

        ctx.restore(); // Restore clip/transform

        // Text Overlay for Full Map
        if (isExpanded) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText("🗺️ World Map", 40, 50);

            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#aaa';
            ctx.fillText(`${roadPath?.length || 0} Road Segments`, 40, 80);

            // Draw visible close button (X) in top-right corner
            const btnX = width - 50;
            const btnY = 50;
            const btnRadius = 25;

            // Button circle with hover effect
            ctx.fillStyle = 'rgba(255, 85, 85, 0.9)';
            ctx.beginPath();
            ctx.arc(btnX, btnY, btnRadius, 0, Math.PI * 2);
            ctx.fill();

            // Button border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // X icon
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(btnX - 10, btnY - 10);
            ctx.lineTo(btnX + 10, btnY + 10);
            ctx.moveTo(btnX + 10, btnY - 10);
            ctx.lineTo(btnX - 10, btnY + 10);
            ctx.stroke();

            // Instructions at bottom
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("Click X button or anywhere to close", width / 2, height - 30);

            // Red dot legend
            ctx.fillStyle = '#FF4444';
            ctx.beginPath();
            ctx.arc(40, height - 60, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'left';
            ctx.fillText("= Your Position", 55, height - 55);
        }

    }, [position, roadPath, isExpanded]);

    return (
        <div
            className={`fixed transition-all duration-300 z-40 ${isExpanded ? 'inset-0 bg-black/80 flex items-center justify-center cursor-pointer' : 'top-8 left-8 w-[200px] h-[200px] cursor-pointer hover:scale-105'
                }`}
            onClick={() => setIsExpanded(!isExpanded)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={isExpanded ? "Click to close map" : "Click to view full map"}
        >
            <canvas
                ref={canvasRef}
                className={`transition-all duration-300 ${isExpanded ? 'rounded-lg shadow-2xl border border-white/10' : 'rounded-full border-2 border-white/20 shadow-lg backdrop-blur-sm'
                    }`}
            />
            {/* MiniMap Expand hint */}
            {!isExpanded && (
                <div className={`absolute -bottom-6 w-full text-center text-xs font-bold uppercase tracking-widest transition-colors ${hovered ? 'text-white' : 'text-white/70'}`}>
                    {hovered ? "Open Map" : "Map"}
                </div>
            )}
            {/* Visible Close Button overlay for expanded mode */}
            {isExpanded && (
                <button
                    className="absolute top-4 right-4 w-14 h-14 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30 transition-all hover:scale-110 z-50"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(false);
                    }}
                    title="Close map"
                >
                    <span className="text-white text-2xl font-bold">✕</span>
                </button>
            )}
        </div>
    );
}
