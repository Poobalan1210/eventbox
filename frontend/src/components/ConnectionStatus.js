import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useWebSocket } from '../contexts/WebSocketContext';
const ConnectionStatus = () => {
    const { connectionStatus } = useWebSocket();
    // Don't show anything when connected (normal state)
    if (connectionStatus === 'connected') {
        return null;
    }
    const getStatusConfig = (status) => {
        switch (status) {
            case 'connecting':
                return {
                    text: 'Connecting...',
                    bgColor: 'bg-yellow-500',
                    icon: '⟳',
                };
            case 'disconnected':
                return {
                    text: 'Connection lost. Reconnecting...',
                    bgColor: 'bg-orange-500',
                    icon: '⚠',
                };
            case 'error':
                return {
                    text: 'Connection error. Retrying...',
                    bgColor: 'bg-red-500',
                    icon: '✕',
                };
            default:
                return {
                    text: 'Unknown status',
                    bgColor: 'bg-gray-500',
                    icon: '?',
                };
        }
    };
    const config = getStatusConfig(connectionStatus);
    return (_jsx("div", { className: `fixed top-0 left-0 right-0 ${config.bgColor} text-white px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium z-50 shadow-md`, role: "alert", "aria-live": "polite", children: _jsxs("span", { className: "inline-flex items-center gap-1 sm:gap-2", children: [_jsx("span", { className: "animate-pulse text-base sm:text-lg", children: config.icon }), _jsx("span", { className: "text-sm sm:text-base", children: config.text })] }) }));
};
export default ConnectionStatus;
