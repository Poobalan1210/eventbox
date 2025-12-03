import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
export default function EventBoxLogo({ size = 'md', animated = true, showText = true, className = '' }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24'
    };
    const textSizeClasses = {
        sm: 'text-xl',
        md: 'text-2xl',
        lg: 'text-3xl',
        xl: 'text-5xl'
    };
    const LogoIcon = () => null;
    const AnimatedLogo = () => (_jsx(motion.div, { animate: {
            rotateY: [0, 10, -10, 0],
            scale: [1, 1.05, 1],
        }, transition: {
            duration: 4,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
        }, children: _jsx(LogoIcon, {}) }));
    return (_jsxs("div", { className: `flex items-center gap-3 ${className}`, children: [animated ? _jsx(AnimatedLogo, {}) : _jsx(LogoIcon, {}), showText && (_jsx("div", { className: "flex flex-col", children: _jsxs("span", { className: `font-bold text-white ${textSizeClasses[size]}`, children: ["Event", _jsx("span", { className: "text-blue-400", children: "Box" })] }) }))] }));
}
