import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        const errorDetails = {
            timestamp: new Date().toISOString(),
            error: error.toString(),
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        console.error('[ErrorBoundary] Application error caught:', errorDetails);

        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                    <div className="bg-gray-800 border border-red-500/50 rounded-xl p-8 max-w-2xl w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="text-red-500" size={32} />
                            <h1 className="text-2xl font-bold text-white">Something Went Wrong</h1>
                        </div>

                        <p className="text-gray-300 mb-4">
                            The application encountered an unexpected error and couldn't continue.
                        </p>

                        {this.state.error && (
                            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
                                <p className="text-sm font-mono text-red-400 mb-2">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <details className="text-xs text-gray-400 mt-2">
                                        <summary className="cursor-pointer hover:text-gray-300">
                                            Stack Trace
                                        </summary>
                                        <pre className="mt-2 overflow-auto max-h-64 whitespace-pre-wrap">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={20} />
                            Reload Application
                        </button>

                        <p className="text-xs text-gray-500 mt-4 text-center">
                            If this problem persists, please check the browser console for more details.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
