'use client';

import { useState } from 'react';
import { getItem, setItem } from '@/lib/storage';

export interface DayData {
    ticked: boolean;
    notes: Array<{ id: string; text: string; createdAt: string }>;
}

export type CalendarStore = Record<string, DayData>;

const STORAGE_KEY = 'openclaw_calendar';

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useCalendarStore() {
    const [store, setStore] = useState<CalendarStore>(() =>
        getItem<CalendarStore>(STORAGE_KEY, {})
    );

    const getDay = (key: string): DayData =>
        store[key] ?? { ticked: false, notes: [] };

    const toggleTick = (key: string) => {
        setStore(prev => {
            const day = prev[key] ?? { ticked: false, notes: [] };
            const next = { ...prev, [key]: { ...day, ticked: !day.ticked } };
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    const addNote = (key: string, text: string) => {
        setStore(prev => {
            const day = prev[key] ?? { ticked: false, notes: [] };
            const note = { id: generateId(), text, createdAt: new Date().toISOString() };
            const next = { ...prev, [key]: { ...day, notes: [...day.notes, note] } };
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    const removeNote = (key: string, noteId: string) => {
        setStore(prev => {
            const day = prev[key] ?? { ticked: false, notes: [] };
            const next = {
                ...prev,
                [key]: { ...day, notes: day.notes.filter(n => n.id !== noteId) },
            };
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    return { store, getDay, toggleTick, addNote, removeNote };
}
