'use client';

import { useState, useEffect } from 'react';
import { getItem, setItem } from '@/lib/storage';

export interface Alarm {
    id: string;
    time: string; // 'HH:MM'
    active: boolean;
}

const STORAGE_KEY = 'horloge_alarms';

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useAlarmStore() {
    const [alarms, setAlarms] = useState<Alarm[]>([]);

    useEffect(() => {
        const load = () => setAlarms(getItem<Alarm[]>(STORAGE_KEY, []));
        load();
        window.addEventListener(`storage_${STORAGE_KEY}`, load);
        const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) load(); };
        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener(`storage_${STORAGE_KEY}`, load);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    const addAlarm = (time: string) => {
        setAlarms(prev => {
            const next = [...prev, { id: generateId(), time, active: true }];
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    const toggleAlarm = (id: string) => {
        setAlarms(prev => {
            const next = prev.map(a => a.id === id ? { ...a, active: !a.active } : a);
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    const removeAlarm = (id: string) => {
        setAlarms(prev => {
            const next = prev.filter(a => a.id !== id);
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    return { alarms, addAlarm, toggleAlarm, removeAlarm };
}
