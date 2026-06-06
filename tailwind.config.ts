import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0a0a',
          2: '#111111',
          3: '#161616',
        },
        line: '#1f1f1f',
        ink: {
          DEFAULT: '#ffffff',
          2: '#888888',
          3: '#444444',
        },
        brand: '#0EA5E9',
        ok: '#34d399',
        warn: '#fbbf24',
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '8px',
        input: '6px',
        pill: '100px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
