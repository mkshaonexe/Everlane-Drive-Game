import { Canvas } from '@react-three/fiber';
import { Stage, OrbitControls } from '@react-three/drei';
import { useGameStore, VEHICLES } from '../stores/gameStore';
import { VehicleModel } from '../vehicle/VehicleModel';
import { Suspense, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export function VehicleSelect({ onBack }: { onBack: () => void }) {
    const { selectedVehicle, setSelectedVehicle } = useGameStore();
    const [hoveredVehicle, setHoveredVehicle] = useState<string | null>(null);

    // Determines which vehicle to show in preview: hovered or selected
    const previewVehicleId = hoveredVehicle || selectedVehicle;

    // Find text for display
    const currentConfig = VEHICLES.find(v => v.id === previewVehicleId) || VEHICLES[0];

    const handleSelect = () => {
        // Selection is already updated via click on list, but ensure it matches preview if we want "Preview then Select" flow?
        // Current logic: clicking list updates selectedVehicle.
        // So this button just confirms and goes back.
        onBack();
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-lg z-50">
            <div className="flex w-full max-w-5xl h-[600px] border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-[#0a0a0a]">

                {/* Left: Vehicle List */}
                <div className="w-1/3 border-r border-white/10 flex flex-col relative z-20 bg-[#0a0a0a]">
                    <div className="p-6 border-b border-white/10 bg-[#0a0a0a]">
                        <h2 className="text-2xl font-bold font-mono text-white tracking-wider">GARAGE</h2>
                        <p className="text-white/40 text-sm mt-1">Select your machine</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-[#0a0a0a]">
                        {VEHICLES.map((vehicle) => {
                            const isSelected = selectedVehicle === vehicle.id;
                            return (
                                <button
                                    key={vehicle.id}
                                    onClick={() => setSelectedVehicle(vehicle.id)}
                                    onMouseEnter={() => setHoveredVehicle(vehicle.id)}
                                    onMouseLeave={() => setHoveredVehicle(null)}
                                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 group relative overflow-hidden
                                        ${isSelected
                                            ? 'bg-white text-black ring-2 ring-white ring-offset-2 ring-offset-black'
                                            : 'bg-white/5 text-white hover:bg-white/10 hover:translate-x-1'
                                        }`}
                                >
                                    {/* Selection Indicator Bar */}
                                    {isSelected && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400" />
                                    )}

                                    <div className="font-bold text-lg">{vehicle.name}</div>
                                    <div className={`text-xs mt-1 ${isSelected ? 'text-black/60' : 'text-white/40'}`}>
                                        {vehicle.description}
                                    </div>

                                    {/* Type badge */}
                                    <div className="absolute top-4 right-4 opacity-50">
                                        {vehicle.type === 'gltf' ? (
                                            <span className="text-[10px] uppercase font-bold border border-current px-1 rounded">Import</span>
                                        ) : (
                                            <span className="text-[10px] uppercase font-bold border border-current px-1 rounded">Stock</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right: 3D Preview */}
                <div className="flex-1 relative bg-gradient-to-br from-[#111] to-[#050505] flex flex-col">
                    {/* Header Info (Top Left) */}
                    <div className="absolute top-6 left-6 z-10 pointer-events-none">
                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                            {currentConfig.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`w-2 h-2 rounded-full ${currentConfig.type === 'gltf' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                            <span className="text-white/60 text-sm font-mono uppercase">{currentConfig.type} Model</span>
                        </div>
                    </div>

                    {/* Back Button (Top Right) */}
                    <div className="absolute top-6 right-6 z-30">
                        <button
                            onClick={onBack}
                            className="bg-black/40 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-all text-sm font-bold uppercase tracking-wider"
                        >
                            Back
                        </button>
                    </div>

                    {/* Canvas Container */}
                    <div className="flex-1 relative w-full h-full">
                        {/* Loading Spinner uses Suspense Fallback.
                             Creating an absolute overlay for loading state.
                             Note: Suspense only triggers if a component suspends.
                             VehicleModel suspends while loading GLTF.
                          */}
                        <Suspense fallback={
                            <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm">
                                <LoadingSpinner />
                            </div>
                        }>
                            <Canvas shadows dpr={[1, 2]} camera={{ position: [4, 2, 4], fov: 45 }}>
                                <Stage environment="city" intensity={0.5} contactShadow={{ opacity: 0.5, blur: 2 }}>
                                    <VehicleModel vehicleId={previewVehicleId} />
                                </Stage>
                                <OrbitControls
                                    autoRotate={false} // Disabled to prevent shaking/jitter
                                    enableZoom={false}
                                    enablePan={false}
                                    minPolarAngle={0}
                                    maxPolarAngle={Math.PI / 2}
                                />
                            </Canvas>
                        </Suspense>
                    </div>

                    {/* Footer Controls (Bottom) */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20 flex items-end justify-between pointer-events-none">
                        <div className="text-white/20 text-xs font-mono uppercase tracking-widest pb-2">
                            {hoveredVehicle && hoveredVehicle !== selectedVehicle ? 'Click list to Select' : 'Currently Selected'}
                        </div>

                        {/* Select / Save Button - Only active on pointer events */}
                        <button
                            onClick={handleSelect}
                            className="pointer-events-auto bg-white text-black hover:bg-slate-200 px-8 py-3 rounded-full font-bold text-lg uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95"
                        >
                            {selectedVehicle === previewVehicleId ? 'Confirm & Drive' : 'Select This Car'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
