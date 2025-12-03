import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect } from 'react';
const ThemeContext = createContext(undefined);
const themeBackgrounds = {
    space: '#000000',
};
const themeColors = {
    space: {
        background: '#000000',
        navBg: 'rgba(15, 12, 41, 0.8)',
        navBgDark: 'rgba(9, 10, 15, 0.9)',
        navText: 'rgba(255, 255, 255, 0.9)',
        navTextHover: '#00d4ff',
        navBorder: 'rgba(0, 212, 255, 1)',
        cardBg: 'rgba(15, 12, 41, 0.6)',
        cardBorder: 'rgba(100, 150, 255, 0.3)',
        textPrimary: '#FFFFFF',
        textSecondary: 'rgba(200, 220, 255, 0.9)',
        accent: '#00d4ff',
    },
};
// Create CSS-only starfield overlay
function createStarfieldOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'theme-overlay';
    overlay.className = 'space-stars';
    document.body.appendChild(overlay);
}
export function ThemeProvider({ children }) {
    const theme = 'space';
    const colors = themeColors[theme] || themeColors.space;
    useEffect(() => {
        // Always use space theme
        localStorage.setItem('quiz-theme', 'space');
        document.documentElement.setAttribute('data-theme', 'space');
        if (document.body) {
            document.body.setAttribute('data-theme', 'space');
            // Remove existing theme overlays
            const existingOverlay = document.getElementById('theme-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
            // Apply black background directly to body
            document.body.style.background = '#000000';
            document.body.style.backgroundAttachment = 'fixed';
            // Add starfield overlay for space theme
            createStarfieldOverlay();
            document.body.style.backgroundSize = 'auto';
            document.body.style.animation = 'none';
        }
    }, [theme]);
    return (_jsx(ThemeContext.Provider, { value: { theme, colors }, children: children }));
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
