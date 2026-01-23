


export function VehicleSelect() {
    // In a real implementation, we would pull available vehicles from a store or config
    // For now, we just have a "Standard" vehicle.
    // We can add a "Sport" or "Offroad" placeholder to show UI functionality.

    // Example: changing a 'vehicleType' in the store (not yet implemented in store, but we can simulate or add it)
    // For MVP/Verification, it's just a visual selector.

    return (
        <div className="absolute top-1/2 left-4 transform -translate-y-1/2 pointer-events-auto">
            <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10
                            text-white w-64">
                <h2 className="text-xl font-bold mb-4 font-mono">VEHICLE SELECT</h2>

                <div className="space-y-2">
                    <button className="w-full text-left p-3 rounded bg-white/10 hover:bg-white/20 transition-colors border-l-4 border-yellow-400">
                        <div className="font-bold">Standard EV</div>
                        <div className="text-xs text-white/50">Balanced performance</div>
                    </button>

                    <button className="w-full text-left p-3 rounded hover:bg-white/10 transition-colors opacity-50 cursor-not-allowed">
                        <div className="font-bold">Sport (Locked)</div>
                        <div className="text-xs text-white/50">High speed, low grip</div>
                    </button>

                    <button className="w-full text-left p-3 rounded hover:bg-white/10 transition-colors opacity-50 cursor-not-allowed">
                        <div className="font-bold">Offroad (Locked)</div>
                        <div className="text-xs text-white/50">High suspension</div>
                    </button>
                </div>
            </div>
        </div>
    );
}
