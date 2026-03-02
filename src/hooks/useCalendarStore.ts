'use client';

import { useState } from 'react';
import { getItem, setItem } from '@/lib/storage';

export interface CalendarEvent {
    id: string;
    title: string;
    startTime: string; // 'HH:MM'
    endTime: string;   // 'HH:MM'
    priority?: 'Low' | 'Medium' | 'High';
}

export interface DayData {
    ticked: boolean;
    notes: Array<{ id: string; text: string; createdAt: string }>;
    events?: CalendarEvent[];
}

export type CalendarStore = Record<string, DayData>;

const STORAGE_KEY = 'horloge_calendar';

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useCalendarStore() {
    const [store, setStore] = useState<CalendarStore>(() =>
        getItem<CalendarStore>(STORAGE_KEY, {})
    );

    const getDay = (key: string): DayData =>
        store[key] ?? { ticked: false, notes: [], events: [] };

    const toggleTick = (key: string) => {
        setStore(prev => {
            const day = prev[key] ?? { ticked: false, notes: [], events: [] };
            const next = { ...prev, [key]: { ...day, ticked: !day.ticked } };
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    const addNote = (key: string, text: string) => {
        setStore(prev => {
            const day = prev[key] ?? { ticked: false, notes: [], events: [] };
            const note = { id: generateId(), text, createdAt: new Date().toISOString() };
            const next = { ...prev, [key]: { ...day, notes: [...day.notes, note] } };
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    const removeNote = (key: string, noteId: string) => {
        setStore(prev => {
            const day = prev[key] ?? { ticked: false, notes: [], events: [] };
            const next = {
                ...prev,
                [key]: { ...day, notes: day.notes.filter(n => n.id !== noteId) },
            };
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    const addEvent = (key: string, event: Omit<CalendarEvent, 'id'>) => {
        setStore(prev => {
            const day = prev[key] ?? { ticked: false, notes: [], events: [] };
            const newEvent: CalendarEvent = { id: generateId(), ...event };
            const next = { ...prev, [key]: { ...day, events: [...(day.events || []), newEvent] } };
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    const removeEvent = (key: string, eventId: string) => {
        setStore(prev => {
            const day = prev[key] ?? { ticked: false, notes: [], events: [] };
            const next = {
                ...prev,
                [key]: { ...day, events: (day.events || []).filter(e => e.id !== eventId) },
            };
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    const updateEvent = (key: string, eventId: string, updates: Partial<CalendarEvent>) => {
        setStore(prev => {
            const day = prev[key] ?? { ticked: false, notes: [], events: [] };
            const next = {
                ...prev,
                [key]: {
                    ...day,
                    events: (day.events || []).map(e => e.id === eventId ? { ...e, ...updates } : e),
                },
            };
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    return { store, getDay, toggleTick, addNote, removeNote, addEvent, removeEvent, updateEvent };
}
