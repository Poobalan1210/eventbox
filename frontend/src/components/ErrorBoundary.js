import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Error Boundary Component - Catches React errors and displays fallback UI
 */
import { Component } from 'react';
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        Object.defineProperty(this, "handleReset", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.setState({
                    hasError: false,
                    error: null,
                    errorInfo: null,
                });
            }
        });
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }
    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
        };
    }
    componentDidCatch(error, errorInfo) {
        // Log error details for debugging
        console.error('Error Boundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }
    render() {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }
            // Default fallback UI
            return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 px-4", children: _jsxs("div", { className: "max-w-md w-full bg-white shadow-lg rounded-lg p-6 md:p-8", children: [_jsx("div", { className: "flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4", children: _jsx("svg", { className: "w-8 h-8 text-red-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }) }), _jsx("h1", { className: "text-2xl font-bold text-gray-900 text-center mb-2", children: "Something went wrong" }), _jsx("p", { className: "text-gray-600 text-center mb-6", children: "We encountered an unexpected error. Please try refreshing the page." }), process.env.NODE_ENV === 'development' && this.state.error && (_jsxs("div", { className: "mb-6 p-4 bg-red-50 border border-red-200 rounded-lg", children: [_jsx("p", { className: "text-sm font-semibold text-red-800 mb-2", children: "Error Details (Development Only):" }), _jsx("p", { className: "text-xs text-red-700 font-mono break-all", children: this.state.error.toString() }), this.state.errorInfo && (_jsxs("details", { className: "mt-2", children: [_jsx("summary", { className: "text-xs text-red-700 cursor-pointer", children: "Stack Trace" }), _jsx("pre", { className: "text-xs text-red-600 mt-2 overflow-auto max-h-40", children: this.state.errorInfo.componentStack })] }))] })), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx("button", { onClick: this.handleReset, className: "flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors", style: { minHeight: '44px' }, children: "Try Again" }), _jsx("button", { onClick: () => window.location.href = '/', className: "flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors", style: { minHeight: '44px' }, children: "Go Home" })] })] }) }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
