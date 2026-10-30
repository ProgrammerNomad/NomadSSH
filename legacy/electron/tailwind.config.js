/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cyber Blue + Zinc Dark Theme
        background: '#09090B',      // zinc-950 - Main background
        surface: '#18181B',          // zinc-900 - Cards, panels, elevated surfaces
        'surface-hover': '#27272A',  // zinc-800 - Hover states
        border: '#3F3F46',           // zinc-700 - Borders, dividers
        text: {
          primary: '#E5E7EB',        // gray-200 - Primary text
          secondary: '#71717A',      // zinc-500 - Muted text
          tertiary: '#52525B',       // zinc-600 - Disabled text
        },
        // Cyber Blue Primary
        primary: {
          DEFAULT: '#06B6D4',        // cyan-500 - Primary actions, links
          hover: '#0891B2',          // cyan-600 - Hover state
          light: '#22D3EE',          // cyan-400 - Accent, highlights
          dark: '#0E7490',           // cyan-700 - Active/pressed state
          subtle: 'rgba(6, 182, 212, 0.1)',  // Backgrounds, badges
        },
        // Secondary accent (Sky Blue)
        secondary: {
          DEFAULT: '#0EA5E9',        // sky-500
          hover: '#0284C7',          // sky-600
          light: '#38BDF8',          // sky-400
        },
        // Status colors
        success: '#10B981',          // emerald-500 - Success states
        error: '#EF4444',            // red-500 - Errors, warnings
        warning: '#F59E0B',          // amber-500 - Warnings
        info: '#3B82F6',             // blue-500 - Info messages
      },
      // Terminal-specific colors
      terminal: {
        background: '#000000',       // Pure black for terminal
        foreground: '#E5E7EB',       // gray-200
        cursor: '#06B6D4',           // cyan-500
        selection: 'rgba(6, 182, 212, 0.3)',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'Cascadia Code',
          'Fira Code',
          'Consolas',
          'Monaco',
          'Courier New',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
