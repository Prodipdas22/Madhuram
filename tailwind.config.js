/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0b0b',
        surface: 'rgba(255,255,255,0.06)',
        'surface-hover': 'rgba(255,255,255,0.10)',
        accent: '#1DB954',
        'accent-hover': '#1ed760',
        muted: '#6b7280',
        subtle: 'rgba(255,255,255,0.04)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif']
      },
      backdropBlur: { xs: '2px' },
      animation: {
        spin_slow: 'spin 8s linear infinite',
        equalizer: 'equalizer 1.2s ease-in-out infinite',
        'pulse-soft': 'pulse 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite'
      },
      keyframes: {
        equalizer: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    }
  },
  plugins: []
}