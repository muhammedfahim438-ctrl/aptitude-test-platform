/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "navy-deep": "#0B1640",
        "primary": "#4152a9",
        "primary-container": "#5a6bc4",
        "on-primary-container": "#f9f6ff",
        "primary-fixed": "#dee1ff",
        "inverse-primary": "#bac3ff",
        "surface-page": "#FBFBFF",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f2ff",
        "surface-container": "#ebedff",
        "surface-container-high": "#e4e7ff",
        "outline-variant": "#c5c5d3",
        "outline": "#757683",
        "ink-subtle": "#6C7596",
        "ink-disabled": "#A7AECB",
        "on-surface": "#0a1845",
        "error": "#E2737A",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "tertiary": "#05664c",
        "tertiary-container": "#2d7f63",
        "secondary": "#8a5108",
        "secondary-container": "#fdb164",
        "on-secondary-container": "#754300",
        "mint-ink": "#1F8A5F",
      },
      fontFamily: {
        'space': ['Space Grotesk', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}