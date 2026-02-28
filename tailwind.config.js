/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['Roboto Mono', 'monospace'],
                display: ['Outfit', 'sans-serif'],
            },
            colors: {
                nothing: {
                    bg: '#0a0a0a',
                    surface: '#111111',
                    accent: '#ff3c00',
                    text: '#f0f0f0',
                    dim: '#666666',
                    border: '#1e1e1e',
                },
                android16: {
                    bg: '#1a1a2e',
                    surface: '#16213e',
                    accent: '#a78bfa',
                    accentAlt: '#818cf8',
                    text: '#e2e8f0',
                    dim: '#94a3b8',
                    border: '#273452',
                },
                bw: {
                    bg: '#000000',
                    surface: '#111111',
                    accent: '#ffffff',
                    text: '#ffffff',
                    dim: '#888888',
                    border: '#333333',
                },
            },
            animation: {
                'dot-pulse': 'dotPulse 1.5s ease-in-out infinite',
                'sweep': 'sweep 60s linear infinite',
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'glow-pulse': 'glowPulse 2s ease-in-out infinite',
                'spin-slow': 'spin 8s linear infinite',
            },
            keyframes: {
                dotPulse: {
                    '0%, 100%': { opacity: '0.3' },
                    '50%': { opacity: '1' },
                },
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                slideUp: {
                    from: { transform: 'translateY(20px)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(167,139,250,0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(167,139,250,0.7)' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-android16': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                'gradient-nothing': 'linear-gradient(180deg, #0a0a0a 0%, #0f0f0f 100%)',
            },
        },
    },
    plugins: [],
};
