import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams } from 'react-router-dom';
import QuizModeManager from '../components/QuizModeManager';
import ConnectionStatus from '../components/ConnectionStatus';
export default function QuizManagement() {
    const { eventId } = useParams();
    if (!eventId) {
        return (_jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6", children: _jsx("div", { className: "bg-answer-red/20 border-2 border-answer-red rounded-lg p-6", children: _jsx("p", { className: "text-white", children: "Invalid event ID" }) }) }));
    }
    return (_jsxs(_Fragment, { children: [_jsx(ConnectionStatus, {}), _jsx(QuizModeManager, { eventId: eventId })] }));
}
