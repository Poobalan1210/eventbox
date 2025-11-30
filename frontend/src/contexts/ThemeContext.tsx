import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeType = 'purple' | 'space';

export interface ThemeColors {
  navBg: string;
  navBgDark: string;
  navText: string;
  navTextHover: string;
  navBorder: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
}

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeBackgrounds = {
  purple: 'linear-gradient(135deg, #46178F 0%, #2D0F5C 50%, #5A1FB3 100%)',
  space: '#000000',
};

const themeColors: Record<ThemeType, ThemeColors> = {
  purple: {
    navBg: 'rgba(70, 23, 143, 0.95)',
    navBgDark: 'rgba(45, 15, 92, 0.95)',
    navText: 'rgba(255, 255, 255, 0.9)',
    navTextHover: '#FFA602',
    navBorder: 'rgba(255, 166, 2, 1)',
    cardBg: 'rgba(255, 255, 255, 0.1)',
    cardBorder: 'rgba(255, 255, 255, 0.2)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    accent: '#FFA602',
  },
  space: {
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('quiz-theme');
    // Validate saved theme
    if (saved === 'purple' || saved === 'space') {
      return saved;
    }
    // Default to purple for any invalid value
    return 'purple';
  });

  const colors = themeColors[theme] || themeColors.purple;

  useEffect(() => {
    // Clean up old theme values on first load
    const saved = localStorage.getItem('quiz-theme');
    if (saved && saved !== 'purple' && saved !== 'space') {
      localStorage.removeItem('quiz-theme');
    }
    
    localStorage.setItem('quiz-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    if (document.body) {
      document.body.setAttribute('data-theme', theme);
      
      // Remove existing theme overlays
      const existingOverlay = document.getElementById('theme-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
      
      // Apply background directly to body
      const background = themeBackgrounds[theme];
      document.body.style.background = background;
      document.body.style.backgroundAttachment = 'fixed';
      
      // Add special effects for space theme
      if (theme === 'space') {
        createStarfieldOverlay();
        document.body.style.backgroundSize = 'auto';
        document.body.style.animation = 'none';
      }
      // No animation for purple theme
      else {
        document.body.style.backgroundSize = 'auto';
        document.body.style.animation = 'none';
      }
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
