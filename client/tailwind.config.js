/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════
        // PRIMARY PALETTE — Indigo (matches mandatory spec #4F46E5)
        // ═══════════════════════════════════════════════════════════
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',  // ← PRIMARY (mandatory)
          700: '#4338ca',  // ← PRIMARY DARK (mandatory)
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // ═══════════════════════════════════════════════════════════
        // ACCENT PALETTE — Blue (#3B82F6 mandatory)
        // ═══════════════════════════════════════════════════════════
        accent: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',  // ← Dark mode accent (mandatory)
          500: '#3b82f6',  // ← ACCENT (mandatory)
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // ═══════════════════════════════════════════════════════════
        // STATUS COLORS (mandatory spec)
        // ═══════════════════════════════════════════════════════════
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // ← SUCCESS (mandatory)
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50:  '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',  // ← WARNING (mandatory)
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',  // ← ERROR/DANGER (mandatory)
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // ═══════════════════════════════════════════════════════════
        // DARK MODE SURFACES (mandatory spec)
        // ═══════════════════════════════════════════════════════════
        dark: {
          bg:   '#0f172a',   // Background
          card: '#1e293b',   // Card surface
          text: '#f1f5f9',   // Text
          sub:  '#94a3b8',   // Subtext
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      boxShadow: {
        'xs':        '0 1px 2px 0 rgba(0,0,0,0.05)',
        'sm':        '0 1px 3px rgba(0,0,0,0.08)',
        'base':      '0 2px 6px rgba(0,0,0,0.08)',
        'md':        '0 4px 12px rgba(0,0,0,0.08)',
        'lg':        '0 8px 24px rgba(0,0,0,0.10)',
        'xl':        '0 16px 40px rgba(0,0,0,0.12)',
        '2xl':       '0 24px 60px rgba(0,0,0,0.15)',
        'card':      '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        'card-hover':'0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(79,70,229,0.08)',
        'primary':   '0 4px 14px rgba(79,70,229,0.35)',
        'primary-lg':'0 8px 30px rgba(79,70,229,0.40)',
        'success':   '0 4px 14px rgba(34,197,94,0.30)',
        'warning':   '0 4px 14px rgba(234,179,8,0.30)',
        'danger':    '0 4px 14px rgba(239,68,68,0.30)',
        'inner':     'inset 0 1px 3px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'xs':  '0.25rem',
        'sm':  '0.375rem',
        'md':  '0.5rem',
        'lg':  '0.75rem',
        'xl':  '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'gradient-primary':  'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
        'gradient-accent':   'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        'gradient-success':  'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
        'gradient-warning':  'linear-gradient(135deg, #eab308 0%, #facc15 100%)',
        'gradient-danger':   'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
        'gradient-surface':  'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
        'gradient-dark':     'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      },
      animation: {
        'fade-in':      'fadeIn 300ms cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in-up':   'fadeInUp 400ms cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-down':   'slideDown 300ms cubic-bezier(0.16,1,0.3,1) forwards',
        'scale-in':     'scaleIn 200ms cubic-bezier(0.16,1,0.3,1) forwards',
        'shimmer':      'shimmer 1.8s ease-in-out infinite',
        'pulse-soft':   'pulseSoft 2.5s ease-in-out infinite',
        'bounce-dot':   'bounceDot 1.4s ease-in-out infinite',
        'spin-slow':    'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeInUp:  { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.75' } },
        bounceDot: { '0%,80%,100%': { transform: 'scale(0)' }, '40%': { transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
