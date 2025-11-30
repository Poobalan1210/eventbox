import { useState } from 'react';
import { useTheme, ThemeType } from '../contexts/ThemeContext';

const themes = [
  {
    id: 'purple' as ThemeType,
    name: 'Purple',
    description: 'Classic Kahoot style',
    preview: 'linear-gradient(135deg, #46178F 0%, #2D0F5C 50%, #5A1FB3 100%)',
  },
  {
    id: 'space' as ThemeType,
    name: '🌌 Space',
    description: 'Animated starfield',
    preview: 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)',
  },
  {
    id: 'forest' as ThemeType,
    name: '🌲 Forest',
    description: 'Deep forest vibes',
    preview: 'linear-gradient(135deg, #0F2027 0%, #203A43 25%, #2C5364 50%, #134E5E 75%, #0A3D2C 100%)',
  },
  {
    id: 'sunset' as ThemeType,
    name: '🌅 Sunset',
    description: 'Warm sunset glow',
    preview: 'linear-gradient(135deg, #FF512F 0%, #DD2476 25%, #F09819 50%, #FF6B6B 75%, #C94B4B 100%)',
  },
  {
    id: 'ocean' as ThemeType,
    name: '🌊 Ocean',
    description: 'Vibrant ocean waves',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
  },
  {
    id: 'aurora' as ThemeType,
    name: '✨ Aurora',
    description: 'Northern lights magic',
    preview: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 25%, #a8edea 50%, #fed6e3 75%, #a8edea 100%)',
  },
  {
    id: 'fire' as ThemeType,
    name: '🔥 Fire',
    description: 'Blazing hot energy',
    preview: 'linear-gradient(135deg, #f12711 0%, #f5af19 25%, #f12711 50%, #f5af19 75%, #f12711 100%)',
  },
  {
    id: 'neon' as ThemeType,
    name: '💫 Neon',
    description: 'Electric neon lights',
    preview: 'linear-gradient(135deg, #12c2e9 0%, #c471ed 25%, #f64f59 50%, #c471ed 75%, #12c2e9 100%)',
  },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Theme Selector Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 w-80 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Choose Theme</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
          <div className="space-y-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  theme === t.id
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg shadow-md flex-shrink-0"
                    style={{ background: t.preview }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      {t.name}
                      {theme === t.id && (
                        <span className="text-blue-500 text-sm">✓</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">{t.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Theme Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl border-2 border-white/20 hover:scale-110"
        title="Change Theme"
      >
        🎨
      </button>
    </div>
  );
}
