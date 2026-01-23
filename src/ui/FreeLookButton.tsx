import { useGameStore } from '../stores/gameStore';

export function FreeLookButton() {
    const { isFreeLookButtonActive, toggleFreeLookButton, isPaused } = useGameStore();

    // Don't show when game is paused
    if (isPaused) return null;

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                toggleFreeLookButton();
            }}
            onMouseDown={(e) => e.stopPropagation()} // Prevent camera rotation start
            className={`
                fixed bottom-32 right-8
                w-14 h-14
                rounded-full
                flex items-center justify-center
                transition-all duration-200
                pointer-events-auto
                border-2
                ${isFreeLookButtonActive
                    ? 'bg-white/30 border-white shadow-lg shadow-white/20'
                    : 'bg-black/40 border-white/30 hover:bg-black/60 hover:border-white/50'
                }
                backdrop-blur-sm
            `}
            title={isFreeLookButtonActive ? "Persistent Camera ON (angles stay after release)" : "Enable Persistent Camera (right-click to rotate)"}
        >
            {/* Eye Icon SVG */}
            <svg
                className={`w-7 h-7 ${isFreeLookButtonActive ? 'text-white' : 'text-white/70'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
            </svg>
        </button>
    );
}
