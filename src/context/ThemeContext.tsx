'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme =
    | 'nothing'
    | 'android16'
    | 'bw'
    | 'amoled'
    | 'ocean'
    | 'sunset'
    | 'forest'
    | 'cyberpunk'
    | 'rosegold'
    | 'aurora'
    | 'light'
    | 'light-warm';

export interface ThemeMeta {
    value: Theme;
    label: string;
    icon: string;
    accent: string;
    bg: string;
    isDark: boolean;
}

export const THEMES: ThemeMeta[] = [
    // ── Dark matte themes ──────────────────────────────────────────────
    { value: 'nothing', label: 'Nothing', icon: '●', accent: '#e8401a', bg: '#0d0d0d', isDark: true },
    { value: 'android16', label: 'Android 16', icon: '◆', accent: '#9b7ef8', bg: '#10101e', isDark: true },
    { value: 'bw', label: 'Dark', icon: '◐', accent: '#ececec', bg: '#111111', isDark: true },
    { value: 'amoled', label: 'Midnight', icon: '◉', accent: '#5ba3d9', bg: '#0a0c10', isDark: true },
    { value: 'ocean', label: 'Ocean', icon: '◈', accent: '#2abfa0', bg: '#080f18', isDark: true },
    { value: 'sunset', label: 'Sunset', icon: '◕', accent: '#cf7035', bg: '#130d08', isDark: true },
    { value: 'forest', label: 'Forest', icon: '◍', accent: '#4aaa68', bg: '#090f09', isDark: true },
    { value: 'cyberpunk', label: 'Gold', icon: '⟡', accent: '#c8a83c', bg: '#0c0b08', isDark: true },
    { value: 'rosegold', label: 'Rose', icon: '✦', accent: '#c06480', bg: '#120a0e', isDark: true },
    { value: 'aurora', label: 'Aurora', icon: '❋', accent: '#2fb386', bg: '#07090f', isDark: true },
    // ── Light matte themes ──────────────────────────────────────────────
    { value: 'light', label: 'Light', icon: '○', accent: '#2563a8', bg: '#f5f4f0', isDark: false },
    { value: 'light-warm', label: 'Warm Light', icon: '☀', accent: '#b5521a', bg: '#f7f0e6', isDark: false },
];

interface ThemeContextType {
    theme: Theme;
    setTheme: (t: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'nothing',
    setTheme: () => { },
    isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        // Read synchronously to avoid a theme flash on load.
        // getItem guards against SSR with typeof window === 'undefined'.
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('openclaw_theme') as Theme | null;
            if (saved && THEMES.find(t => t.value === saved)) return saved;
        }
        return 'nothing';
    });

    const setTheme = (t: Theme) => {
        setThemeState(t);
        localStorage.setItem('openclaw_theme', t);
    };

    useEffect(() => {
        const root = document.documentElement;
        THEMES.forEach(t => root.classList.remove(`theme-${t.value}`));
        root.classList.add(`theme-${theme}`);
    }, [theme]);

    const isDark = THEMES.find(t => t.value === theme)?.isDark ?? true;

    return (
        <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
