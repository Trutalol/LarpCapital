/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#08090b',
        panel: '#111215',
        panel2: '#16171b',
        line: '#212329',
        line2: '#2b2e35',
        ink: '#e7e8eb',
        mute: '#8a8f99',
        dim: '#5b606a',
        up: '#2fd98a',
        down: '#f2545b',
        buy: '#2962ff',
        warn: '#f5b83d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['Unbounded', 'Inter', 'sans-serif'],
        script: ['"Great Vibes"', 'cursive'],
      },
    },
  },
  plugins: [],
};
