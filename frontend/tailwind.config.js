/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warehouse: {
          primary: '#1e3a8a',
          secondary: '#0f172a',
          accent: '#0ea5e9',
          success: '#22c55e',
          warning: '#f59e0b',
          danger: '#ef4444',
        }
      },
      animation: {
        'pulse-fast': 'pulse 0.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash': 'flash 0.5s ease-in-out infinite alternate',
      },
      keyframes: {
        flash: {
          '0%': { opacity: '1', backgroundColor: '#dc2626' },
          '100%': { opacity: '0.7', backgroundColor: '#991b1b' },
        }
      }
    },
  },
  plugins: [],
}
