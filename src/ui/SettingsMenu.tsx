import { useGameStore } from '../stores/gameStore';
import { useEffect } from 'react';

export function SettingsMenu({ onClose }: { onClose: () => void }) {
    const isMuted = useGameStore(state => state.isMuted);
    const toggleMute = useGameStore(state => state.toggleMute);
    const selectedVehicle = useGameStore(state => state.selectedVehicle);
    const setSelectedVehicle = useGameStore(state => state.setSelectedVehicle);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const vehicles = [
        { id: 'standard', name: 'Standard EV', desc: 'Balanced performance' },
        { id: 'sport', name: 'Sport GT', desc: 'High speed, loose rear' },
        { id: 'offroad', name: 'Offroad 4x4', desc: 'High suspension, max grip' },
        { id: 'bus', name: 'City Bus', desc: 'Heavy, slow, driftable' },
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
            <div className="bg-[#1a1a1a] w-[500px] max-w-full rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col p-6 font-sans">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white tracking-wider flex items-center gap-2">
                        <span>⚙️</span> SETTINGS
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Audio Section */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-3">Audio</h3>
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{isMuted ? '🔇' : '🔊'}</span>
                            <div>
                                <div className="text-white font-medium">Master Volume</div>
                                <div className="text-xs text-white/50">{isMuted ? 'Muted' : 'Active'}</div>
                            </div>
                        </div>
                        <button
                            onClick={toggleMute}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${isMuted
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                }`}
                        >
                            {isMuted ? 'UNMUTE' : 'MUTE'}
                        </button>
                    </div>
                </div>

                {/* Vehicle Section */}
                <div>
                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-3">Garage</h3>
                    <div className="grid gap-3">
                        {vehicles.map(v => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVehicle(v.id)}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left group ${selectedVehicle === v.id
                                        ? 'bg-white/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div>
                                    <div className={`font-bold transition-colors ${selectedVehicle === v.id ? 'text-indigo-400' : 'text-white'}`}>
                                        {v.name}
                                    </div>
                                    <div className="text-xs text-white/50">{v.desc}</div>
                                </div>
                                {selectedVehicle === v.id && (
                                    <div className="text-indigo-400 text-sm font-bold">SELECTED</div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
