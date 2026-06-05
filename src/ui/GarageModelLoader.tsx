import { useProgress, Html } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';

/**
 * Shown inside the R3F Canvas (via Html) while models are loading.
 * Uses useProgress to get real download % from drei's loader.
 */
export function GarageModelLoader() {
    const { active, progress, item, loaded, total } = useProgress();
    const [visible, setVisible] = useState(false);
    const [displayProgress, setDisplayProgress] = useState(0);
    const rafRef = useRef<number | null>(null);
    const targetRef = useRef(0);

    // Smoothly animate the progress bar value
    useEffect(() => {
        targetRef.current = progress;

        const animate = () => {
            setDisplayProgress(prev => {
                const diff = targetRef.current - prev;
                if (Math.abs(diff) < 0.5) return targetRef.current;
                return prev + diff * 0.12;
            });
            rafRef.current = requestAnimationFrame(animate);
        };

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(animate);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [progress]);

    // Show the overlay when loading starts, hide with a small delay when done
    useEffect(() => {
        if (active) {
            setVisible(true);
        } else {
            const t = setTimeout(() => setVisible(false), 400);
            return () => clearTimeout(t);
        }
    }, [active]);

    if (!visible) return null;

    // Extract just the filename for display
    const filename = item ? item.split('/').pop()?.split('?')[0] ?? '' : '';
    const shortName = filename.length > 32 ? '...' + filename.slice(-28) : filename;

    return (
        <Html
            center
            style={{ pointerEvents: 'none', userSelect: 'none', width: '340px' }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '28px 32px',
                    background: 'rgba(8, 8, 16, 0.92)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)',
                    opacity: active ? 1 : 0,
                    transition: 'opacity 0.35s ease',
                    minWidth: '280px',
                }}
            >
                {/* Spinning car icon */}
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    animation: 'spin 1.4s linear infinite',
                    boxShadow: '0 0 20px rgba(99,102,241,0.4)',
                }}>
                    🚗
                </div>

                {/* Label */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.9)',
                        marginBottom: '4px',
                        fontFamily: 'ui-monospace, monospace',
                    }}>
                        Loading 3D Model
                    </div>
                    {shortName && (
                        <div style={{
                            fontSize: '10px',
                            color: 'rgba(255,255,255,0.35)',
                            fontFamily: 'ui-monospace, monospace',
                            maxWidth: '260px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {shortName}
                        </div>
                    )}
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%' }}>
                    <div style={{
                        width: '100%',
                        height: '4px',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '999px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${displayProgress}%`,
                            background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                            borderRadius: '999px',
                            transition: 'width 0.1s linear',
                            boxShadow: '0 0 8px rgba(99,102,241,0.7)',
                        }} />
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '6px',
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.4)',
                        fontFamily: 'ui-monospace, monospace',
                    }}>
                        <span>{loaded} / {total} assets</span>
                        <span style={{ color: '#a855f7', fontWeight: 700 }}>
                            {Math.round(displayProgress)}%
                        </span>
                    </div>
                </div>

                {/* Animated dots */}
                <div style={{
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: '#6366f1',
                            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.2; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </Html>
    );
}
