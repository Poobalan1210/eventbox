import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function PrivacySelector({ value, onChange, disabled = false }) {
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-base font-bold text-white", children: "\uD83D\uDD10 Quiz Privacy" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("button", { type: "button", onClick: () => !disabled && onChange('private'), disabled: disabled, className: `
            relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-h-[56px]
            ${value === 'private'
                            ? 'bg-answer-blue/30 border-answer-blue text-white shadow-lg'
                            : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20 hover:border-white/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `, children: [_jsx("div", { className: `
            flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${value === 'private' ? 'border-white bg-white' : 'border-white/50'}
          `, children: value === 'private' && (_jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-answer-blue" })) }), _jsxs("div", { className: "flex-1 text-left", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-xl", children: "\uD83D\uDD12" }), _jsx("span", { className: "font-bold text-base", children: "Private" })] }), _jsx("p", { className: "text-xs text-white/80", children: "Requires Game PIN or link to join" })] })] }), _jsxs("button", { type: "button", onClick: () => !disabled && onChange('public'), disabled: disabled, className: `
            relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-h-[56px]
            ${value === 'public'
                            ? 'bg-answer-green/30 border-answer-green text-white shadow-lg'
                            : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20 hover:border-white/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `, children: [_jsx("div", { className: `
            flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${value === 'public' ? 'border-white bg-white' : 'border-white/50'}
          `, children: value === 'public' && (_jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-answer-green" })) }), _jsxs("div", { className: "flex-1 text-left", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-xl", children: "\uD83C\uDF10" }), _jsx("span", { className: "font-bold text-base", children: "Public" })] }), _jsx("p", { className: "text-xs text-white/80", children: "Discoverable in public quiz browser" })] })] })] }), disabled && (_jsx("p", { className: "text-xs text-white/60 italic", children: "Privacy settings cannot be changed for live events" }))] }));
}
