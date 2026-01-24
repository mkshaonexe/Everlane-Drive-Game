import { useGameStore } from '../stores/gameStore';
import { useEffect, useState } from 'react';

type Tab = 'graphics' | 'vehicle' | 'audio' | 'general';

export function SettingsMenu({ onClose }: { onClose: () => void }) {
    const isMuted = useGameStore(state => state.isMuted);
    const toggleMute = useGameStore(state => state.toggleMute);
    const selectedVehicle = useGameStore(state => state.selectedVehicle);
    const setSelectedVehicle = useGameStore(state => state.setSelectedVehicle);
    const showFps = useGameStore(state => state.showFps);
    const toggleShowFps = useGameStore(state => state.toggleShowFps);

    const [activeTab, setActiveTab] = useState<Tab>('graphics');

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

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'graphics', label: 'Graphics', icon: '🎨' },
        { id: 'vehicle', label: 'Garage', icon: '🚗' },
        { id: 'audio', label: 'Audio', icon: '🔊' },
        { id: 'general', label: 'General', icon: '⚙️' },
    ];

    return (
        <div className="fixed inset-0 z-[200] bg-[#0a0a0a] text-white font-sans flex flex-col animate-fadeIn pointer-events-auto">
            {/* Header */}
            <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md">
                <h2 className="text-3xl font-black tracking-tighter italic flex items-center gap-3">
                    <span className="text-indigo-500">SLOW</span> ROADS
                    <span className="text-sm font-normal text-white/40 not-italic ml-4 border-l border-white/20 pl-4">SETTINGS</span>
                </h2>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-105"
                >
                    ✕
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 bg-black/20 border-r border-white/5 flex flex-col py-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-8 py-4 text-left flex items-center gap-4 transition-all border-l-4 ${activeTab === tab.id
                                ? 'border-indigo-500 bg-white/5 text-white'
                                : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className="text-xl">{tab.icon}</span>
                            <span className="font-bold tracking-wide uppercase text-sm">{tab.label}</span>
                        </button>
                    ))}
                </aside>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-12 bg-gradient-to-br from-[#111] to-black">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-4xl font-bold mb-8 capitalize">{tabs.find(t => t.id === activeTab)?.label}</h1>

                        {/* GRAPHICS TAB */}
                        {activeTab === 'graphics' && (
                            <div className="space-y-6">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">FPS Counter</h3>
                                            <p className="text-white/50 text-sm">Show frames per second in the HUD</p>
                                        </div>
                                        <button
                                            onClick={toggleShowFps}
                                            className={`w-14 h-8 rounded-full transition-colors relative ${showFps ? 'bg-indigo-500' : 'bg-white/20'}`}
                                        >
                                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-md ${showFps ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm">
                                    More graphics settings coming soon.
                                </div>
                            </div>
                        )}

                        {/* VEHICLE TAB */}
                        {activeTab === 'vehicle' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {vehicles.map(v => (
                                    <button
                                        key={v.id}
                                        onClick={() => setSelectedVehicle(v.id)}
                                        className={`group relative p-6 rounded-2xl border transition-all text-left overflow-hidden ${selectedVehicle === v.id
                                            ? 'bg-indigo-900/20 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)] scale-[1.02]'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                            }`}
                                    >
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className={`font-bold text-xl transition-colors ${selectedVehicle === v.id ? 'text-indigo-400' : 'text-white'}`}>
                                                    {v.name}
                                                </div>
                                                {selectedVehicle === v.id && (
                                                    <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Active</span>
                                                )}
                                            </div>
                                            <p className="text-white/50 text-sm">{v.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* AUDIO TAB */}
                        {activeTab === 'audio' && (
                            <div className="space-y-6">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {isMuted ? '🔇' : '🔊'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">Master Volume</h3>
                                                <p className="text-white/50 text-sm">{isMuted ? 'Audio is muted' : 'Audio is active'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={toggleMute}
                                            className="px-6 py-2 rounded-lg font-bold text-sm bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
                                        >
                                            {isMuted ? 'UNMUTE' : 'MUTE'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* GENERAL TAB */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <h3 className="font-bold text-lg mb-4 text-white/50 uppercase tracking-widest text-xs">Controls</h3>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-white/70">Steer</span>
                                            <span className="font-mono font-bold">WASD / Arrows</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-white/70">Brake</span>
                                            <span className="font-mono font-bold">Spacebar</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-white/70">Reset Car</span>
                                            <span className="font-mono font-bold">R</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-white/70">Toggle Menu</span>
                                            <span className="font-mono font-bold">ESC</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-white/70">Camera Rotate</span>
                                            <span className="font-mono font-bold">Right Click + Drag</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-white/70">Camera Zoom</span>
                                            <span className="font-mono font-bold">Scroll Wheel</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
