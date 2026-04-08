import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        display: ['32px', { lineHeight: '1', letterSpacing: '-0.05em' }],
        'display-lg': ['58px', { lineHeight: '1', letterSpacing: '-0.05em' }],
        meta: ['13px', { lineHeight: '1', letterSpacing: '0.03em' }],
      },
      fontFamily: {
        sans: ['ABCDiatype', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#312E2E',
        stone: '#F2F2F2',
        pink: '#FF9EFA',
      },
    },
  },
  plugins: [],
}

export default config
