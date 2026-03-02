'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getItem, setItem } from '@/lib/storage';

export type ClockSize = 'sm' | 'md' | 'lg' | 'xl';
export type ScreensaverType = 'clock' | 'stopwatch' | 'timer' | 'none';
export type ClockPosition = 'center' | 'top-left' | 'top-right' | 'floating';
export type HourFormat = '12' | '24';

interface Settings {
    clockSize: ClockSize;
    clockScale: number;
    screensaverType: ScreensaverType;
    screensaverIdleMs: number;
    hourFormat: HourFormat;
    showSeconds: boolean;
    showDate: boolean;
    clockOpacity: number;
    clockPosition: ClockPosition;
    pinnedClockVisible: boolean;
    homeClockType: string;  // gallery clock id, or 'default' for theme clock
}

interface SettingsContextType extends Settings {
    setClockSize: (s: ClockSize) => void;
    setClockScale: (n: number) => void;
    setScreensaverType: (s: ScreensaverType) => void;
    setScreensaverIdleMs: (ms: number) => void;
    setHourFormat: (f: HourFormat) => void;
    setShowSeconds: (v: boolean) => void;
    setShowDate: (v: boolean) => void;
    setClockOpacity: (n: number) => void;
    setClockPosition: (p: ClockPosition) => void;
    setPinnedClockVisible: (v: boolean) => void;
    setHomeClockType: (id: string) => void;
}

const defaults: Settings = {
    clockSize: 'lg',
    clockScale: 1.0,
    screensaverType: 'clock',
    screensaverIdleMs: 60000,
    hourFormat: '12',
    showSeconds: true,
    showDate: true,
    clockOpacity: 1.0,
    clockPosition: 'center',
    pinnedClockVisible: false,
    homeClockType: 'default',
};

const SettingsContext = createContext<SettingsContextType>({
    ...defaults,
    setClockSize: () => { },
    setClockScale: () => { },
    setScreensaverType: () => { },
    setScreensaverIdleMs: () => { },
    setHourFormat: () => { },
    setShowSeconds: () => { },
    setShowDate: () => { },
    setClockOpacity: () => { },
    setClockPosition: () => { },
    setPinnedClockVisible: () => { },
    setHomeClockType: () => { },
});

const STORAGE_KEY = 'horloge_settings_v2';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaults);

    useEffect(() => {
        setSettings(getItem<Settings>(STORAGE_KEY, defaults));
    }, []);

    const update = (patch: Partial<Settings>) => {
        setSettings(prev => {
            const next = { ...prev, ...patch };
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    return (
        <SettingsContext.Provider value={{
            ...settings,
            setClockSize: (s) => update({ clockSize: s }),
            setClockScale: (n) => update({ clockScale: n }),
            setScreensaverType: (s) => update({ screensaverType: s }),
            setScreensaverIdleMs: (ms) => update({ screensaverIdleMs: ms }),
            setHourFormat: (f) => update({ hourFormat: f }),
            setShowSeconds: (v) => update({ showSeconds: v }),
            setShowDate: (v) => update({ showDate: v }),
            setClockOpacity: (n) => update({ clockOpacity: n }),
            setClockPosition: (p) => update({ clockPosition: p }),
            setPinnedClockVisible: (v) => update({ pinnedClockVisible: v }),
            setHomeClockType: (id) => update({ homeClockType: id }),
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);

export const clockSizes: Record<ClockSize, number> = {
    sm: 0.6,
    md: 0.8,
    lg: 1.0,
    xl: 1.25,
};
