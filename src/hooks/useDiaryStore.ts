'use client';

import { useState } from 'react';
import { getItem, setItem } from '@/lib/storage';

export interface DiaryEntry {
    id: string;
    title: string;
    body: string;
    category?: string;
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = 'horloge_diary';

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useDiaryStore() {
    const [entries, setEntries] = useState<DiaryEntry[]>(() =>
        getItem<DiaryEntry[]>(STORAGE_KEY, [])
    );

    const save = (data: { id?: string; title: string; body: string; category?: string }) => {
        const now = new Date().toISOString();
        setEntries(prev => {
            let next: DiaryEntry[];
            if (data.id) {
                next = prev.map(e =>
                    e.id === data.id ? { ...e, title: data.title, body: data.body, category: data.category ?? e.category, updatedAt: now } : e
                );
            } else {
                const entry: DiaryEntry = {
                    id: generateId(),
                    title: data.title,
                    body: data.body,
                    category: data.category,
                    createdAt: now,
                    updatedAt: now,
                };
                next = [entry, ...prev];
            }
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    const remove = (id: string) => {
        setEntries(prev => {
            const next = prev.filter(e => e.id !== id);
            setItem(STORAGE_KEY, next);
            return next;
        });
    };

    return { entries, save, remove };
}
