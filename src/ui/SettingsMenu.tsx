import { useGameStore, VEHICLES, MAPS } from '../stores/gameStore';
import { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stage, OrbitControls, Html, Environment } from '@react-three/drei';
import { VehicleModel } from '../vehicle/VehicleModel';
import { LoadingSpinner } from './LoadingSpinner';
import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

type Tab = 'graphics' | 'vehicle' | 'map' | 'audio' | 'general';

// Mini GLTF Map Preview component
function MapPreviewModel({ path, scale = 1 }: { path: string; scale?: number }) {
    const { scene } = useGLTF(path);
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    return <primitive object={clonedScene} scale={scale * 0.005} position={[0, -1, 0]} />;
}

export function SettingsMenu({ onClose }: { onClose: () => void }) {
    const isMuted = useGameStore(state => state.isMuted);
    const toggleMute = useGameStore(state => state.toggleMute);
    const selectedVehicle = useGameStore(state => state.selectedVehicle);
    const setSelectedVehicle = useGameStore(state => state.setSelectedVehicle);
    const selectedMap = useGameStore(state => state.selectedMap);
    const setSelectedMap = useGameStore(state => state.setSelectedMap);
    const showFps = useGameStore(state => state.showFps);
    const toggleShowFps = useGameStore(state => state.toggleShowFps);

    const [activeTab, setActiveTab] = useState<Tab>('graphics');
    const [previewVehicle, setPreviewVehicle] = useState(selectedVehicle);
    const [previewMap, setPreviewMap] = useState(selectedMap);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'graphics', label: 'Graphics', icon: '🎨' },
        { id: 'vehicle', label: 'Garage', icon: '🚗' },
        { id: 'map', label: 'Maps', icon: '🗺️' },
        { id: 'audio', label: 'Audio', icon: '🔊' },
        { id: 'general', label: 'General', icon: '⚙️' },
    ];

    const currentMapConfig = MAPS.find(m => m.id === previewMap) || MAPS[0];
    const currentVehicleConfig = VEHICLES.find(v => v.id === previewVehicle) || VEHICLES[0];

    return (
        <div className="fixed inset-0 z-[200] bg-[#0a0a0a] text-white font-sans flex flex-col animate-fadeIn pointer-events-auto">
            {/* Header */}
            <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md">
                <h2 className="text-3xl font-black tracking-tighter italic flex items-center gap-3">
                    <span className="text-indigo-500">EVERLANE</span> DRIVE
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

                        {/* GARAGE / VEHICLE TAB */}
                        {activeTab === 'vehicle' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {VEHICLES.map(v => (
                                        <button
                                            key={v.id}
                                            onClick={() => {
                                                setSelectedVehicle(v.id);
                                                setPreviewVehicle(v.id);
                                            }}
                                            onMouseEnter={() => setPreviewVehicle(v.id)}
                                            onMouseLeave={() => setPreviewVehicle(selectedVehicle)}
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
                                                    <div className="flex gap-2">
                                                        {selectedVehicle === v.id && (
                                                            <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Active</span>
                                                        )}
                                                        {v.type === 'gltf' && (
                                                            <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-purple-500/30">3D Model</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-white/50 text-sm">{v.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* 3D Preview Section */}
                                <div className="h-[320px] w-full bg-black/40 rounded-2xl border border-white/10 overflow-hidden relative group">
                                    <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                                        <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Preview</span>
                                    </div>
                                    <div className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{currentVehicleConfig.name}</span>
                                    </div>
                                    <Canvas shadows dpr={[1, 2]} camera={{ position: [4, 2, 4], fov: 45 }}>
                                        <Suspense fallback={
                                            <Html center>
                                                <LoadingSpinner />
                                            </Html>
                                        }>
                                            <Stage environment="city" intensity={0.5}>
                                                <VehicleModel vehicleId={previewVehicle} />
                                            </Stage>
                                            <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom={false} enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
                                        </Suspense>
                                    </Canvas>
                                </div>
                            </div>
                        )}

                        {/* MAP TAB */}
                        {activeTab === 'map' && (
                            <div className="space-y-6">
                                <p className="text-white/50 text-sm mb-4">Select a map environment. Changes take effect when you resume driving.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {MAPS.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => {
                                                setSelectedMap(m.id);
                                                setPreviewMap(m.id);
                                            }}
                                            onMouseEnter={() => setPreviewMap(m.id)}
                                            onMouseLeave={() => setPreviewMap(selectedMap)}
                                            className={`group relative p-6 rounded-2xl border transition-all text-left overflow-hidden ${selectedMap === m.id
                                                ? 'bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_30px_rgba(52,211,153,0.15)] scale-[1.02]'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                                }`}
                                        >
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className={`font-bold text-xl transition-colors ${selectedMap === m.id ? 'text-emerald-400' : 'text-white'}`}>
                                                        {m.name}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {selectedMap === m.id && (
                                                            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Active</span>
                                                        )}
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border ${m.type === 'gltf'
                                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                                            }`}>
                                                            {m.type === 'gltf' ? '3D World' : 'Infinite'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-white/50 text-sm">{m.description}</p>

                                                {/* Fog preview bar */}
                                                {m.fogColor && (
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <div
                                                            className="w-4 h-4 rounded-full border border-white/20"
                                                            style={{ backgroundColor: m.fogColor }}
                                                        />
                                                        <span className="text-white/30 text-xs font-mono">Atmosphere: {m.fogColor}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Map 3D Preview */}
                                <div className="h-[320px] w-full bg-black/40 rounded-2xl border border-white/10 overflow-hidden relative">
                                    <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                                        <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Map Preview</span>
                                    </div>
                                    <div className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{currentMapConfig.name}</span>
                                    </div>

                                    {currentMapConfig.type === 'gltf' && currentMapConfig.path ? (
                                        <Canvas shadows dpr={[1, 2]} camera={{ position: [30, 20, 30], fov: 55 }}>
                                            <Suspense fallback={
                                                <Html center>
                                                    <LoadingSpinner />
                                                </Html>
                                            }>
                                                <ambientLight intensity={1.5} />
                                                <directionalLight position={[10, 20, 10]} intensity={2} />
                                                <Environment preset="sunset" />
                                                <MapPreviewModel path={currentMapConfig.path} scale={currentMapConfig.scale ?? 1} />
                                                <OrbitControls autoRotate autoRotateSpeed={0.3} enableZoom={true} enablePan={false} minPolarAngle={0.2} maxPolarAngle={Math.PI / 2.5} />
                                            </Suspense>
                                        </Canvas>
                                    ) : (
                                        /* Procedural map preview: Illustrated card */
                                        <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                                            <div
                                                className="absolute inset-0"
                                                style={{
                                                    background: 'linear-gradient(135deg, #1a2a1a 0%, #2d4a2d 40%, #4a7a4a 70%, #c8b99a 100%)',
                                                }}
                                            />
                                            {/* Road lines */}
                                            <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 400 300">
                                                <path d="M 200 300 Q 180 200 160 150 Q 140 100 180 50" stroke="#e0d0a0" strokeWidth="20" fill="none" strokeLinecap="round" />
                                                <path d="M 200 300 Q 180 200 160 150 Q 140 100 180 50" stroke="#fff" strokeWidth="2" fill="none" strokeDasharray="15 15" strokeLinecap="round" />
                                            </svg>
                                            <div className="relative z-10 text-center">
                                                <div className="text-6xl mb-4">🛣️</div>
                                                <div className="text-white font-bold text-xl">Infinite Procedural</div>
                                                <div className="text-white/50 text-sm mt-1">Dynamically generated highway</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm flex items-start gap-3">
                                    <span className="text-lg">ℹ️</span>
                                    <span>Map changes will apply when you exit the settings and resume the game. Press <strong>ESC</strong> to close and start driving.</span>
                                </div>
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
