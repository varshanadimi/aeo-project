/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#7c6ff0',
        'brand-dark': '#6a5ee0',
        'brand-dim': '#3d3670',
        surface: '#18181f',
        'surface-deep': '#111116',
        border: '#2a2a35',
        'bg-app': '#0d0d0f',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
