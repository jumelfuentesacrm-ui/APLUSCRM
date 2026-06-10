/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: 'oklch(0.74 0.115 75)',
        'gold-soft': 'oklch(0.88 0.06 80)',
        ink: 'oklch(0.18 0.012 60)',
        cream: 'oklch(0.985 0.008 85)',
        border: 'oklch(0.88 0.015 75)',
        background: 'oklch(0.985 0.008 85)',
        foreground: 'oklch(0.18 0.012 60)',
        'muted-foreground': 'oklch(0.45 0.018 70)',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'float-slow': 'float-slow 14s ease-in-out infinite',
        'float-slower': 'float-slower 18s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s ease-out infinite',
        marquee: 'marquee 40s linear infinite',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(20px,-30px) scale(1.05)' },
        },
        'float-slower': {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-30px,20px) scale(1.08)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
