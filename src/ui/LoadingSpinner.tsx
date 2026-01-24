
export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center h-full w-full">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                <span className="text-white/50 text-sm font-bold uppercase tracking-widest animate-pulse">
                    Loading Model...
                </span>
            </div>
        </div>
    );
}
