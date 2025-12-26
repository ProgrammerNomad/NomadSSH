/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1e1e1e',
        surface: '#252526',
        border: '#3e3e42',
        text: {
          primary: '#cccccc',
          secondary: '#858585',
        },
        accent: {
          DEFAULT: '#007acc',
          hover: '#005a9e',
        },
        success: '#4ec9b0',
        error: '#f48771',
        warning: '#dcdcaa',
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
