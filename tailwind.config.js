/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-color)',
        'bg-start': 'var(--bg-gradient-start)',
        'bg-end': 'var(--bg-gradient-end)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'accent-cyan': 'var(--accent-cyan)',
        'accent-blue': 'var(--accent-blue)',
        'glass-bg': 'var(--glass-bg)',
        'glass-border': 'var(--glass-border)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
