import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class GameErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/90 text-white p-8">
                    <div className="max-w-2xl w-full bg-slate-800 p-6 rounded-lg shadow-xl overflow-hidden">
                        <h1 className="text-2xl font-bold mb-4 text-red-400">Game Crashed</h1>
                        <div className="bg-slate-950 p-4 rounded overflow-auto max-h-[60vh] text-sm font-mono">
                            <p className="text-red-300 font-bold mb-2">{this.state.error?.toString()}</p>
                            <pre className="text-slate-400 whitespace-pre-wrap">
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>
                        <button
                            className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold"
                            onClick={() => window.location.reload()}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
