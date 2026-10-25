/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Dark Space & Golden Amber Palette from HTML Reference
                cosmos: {
                    bg: '#02050b',
                    panel: 'rgba(10, 20, 36, 0.78)',
                    panelSolid: '#0a1424',
                    panelDark: '#060d18',
                    line: 'rgba(127, 178, 212, 0.24)',
                    ink: '#e8f1f8',
                    mute: '#8fa6ba',
                    steel: '#7fb2d4',
                    amber: '#f2c14e',
                    cyan: '#6fd6e8',
                },
                brand: {
                    primary: '#f2c14e',
                    secondary: '#7fb2d4',
                    slateDark: '#0a1424',
                    slateLight: '#e8f1f8',
                },
            },
            fontFamily: {
                sans: ['"Bricolage Grotesque"', 'Inter', '-apple-system', 'sans-serif'],
                mono: ['"IBM Plex Mono"', 'JetBrains Mono', 'ui-monospace', 'monospace'],
            },
            boxShadow: {
                'cosmic': '0 4px 24px -2px rgba(2, 5, 11, 0.8)',
                'amber-glow': '0 0 15px rgba(242, 193, 78, 0.35)',
                'cyan-glow': '0 0 15px rgba(111, 214, 232, 0.35)',
            },
        },
    },
    plugins: [],
}
