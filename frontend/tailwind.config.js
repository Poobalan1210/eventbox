/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Kahoot-inspired color palette
      colors: {
        'kahoot-purple': '#46178F',
        'kahoot-purple-dark': '#2D0F5C',
        'kahoot-purple-light': '#5A1FB3',
        'answer-red': '#E21B3C',
        'answer-blue': '#1368CE',
        'answer-yellow': '#FFA602',
        'answer-green': '#26890C',
        'answer-purple': '#9C27B0',
      },
      // Kahoot-style typography
      fontSize: {
        'question': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'question-mobile': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        'answer': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'answer-mobile': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
      },
      // Enhanced spacing for mobile readability
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      // Mobile-first breakpoints (Tailwind defaults are already mobile-first)
      screens: {
        'xs': '320px',   // Extra small devices
        'sm': '640px',   // Small devices (tablets)
        'md': '768px',   // Medium devices
        'lg': '1024px',  // Large devices
        'xl': '1280px',  // Extra large devices
        '2xl': '1536px', // 2X Extra large devices
      },
      // Ensure minimum touch target sizes
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
}
