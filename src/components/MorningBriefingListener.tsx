'use client';

import { useEffect, useRef, useState } from 'react';
import { useAlarmStore } from '@/hooks/useAlarmStore';
import { useCalendarStore } from '@/hooks/useCalendarStore';
import { useDiaryStore } from '@/hooks/useDiaryStore';

export default function MorningBriefingListener() {
    const { alarms } = useAlarmStore();
    const { getDay } = useCalendarStore();
    const { entries } = useDiaryStore();
    const [briefingText, setBriefingText] = useState<string | null>(null);
    const lastTriggered = useRef<string>('');

    useEffect(() => {
        const checkAlarms = async () => {
            const now = new Date();
            const timeStr = now.toTimeString().slice(0, 5); // HH:MM
            const dateStr = now.toISOString().split('T')[0];
            const triggerKey = `${dateStr}-${timeStr}`;

            if (lastTriggered.current === triggerKey) return;

            const activeAlarm = alarms.find(a => a.active && a.time === timeStr);
            if (activeAlarm) {
                lastTriggered.current = triggerKey;
                await triggerBriefing(dateStr);
            }
        };

        const triggerBriefing = async (dateKey: string) => {
            try {
                // Get data for today
                const todayData = getDay(dateKey);
                // Get recent diary entries (last 3)
                const recentDiary = [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

                const res = await fetch('/api/briefing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dateKey,
                        events: todayData.events || [],
                        notes: todayData.notes || [],
                        diaryEntries: recentDiary,
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.briefing) {
                        setBriefingText(data.briefing);
                        playAudio(data.briefing);
                    }
                }
            } catch (err) {
                console.error("Failed to trigger briefing:", err);
            }
        };

        const playAudio = (text: string) => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'en-US';
                utterance.rate = 0.95; // Slightly slower for relaxed tone
                utterance.pitch = 1.0;
                window.speechSynthesis.speak(utterance);
            }
        };

        const interval = setInterval(checkAlarms, 10000); // check every 10 seconds
        return () => clearInterval(interval);
    }, [alarms, getDay, entries]);

    if (!briefingText) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm p-5 rounded-3xl shadow-2xl themed-transition"
            style={{ background: 'var(--surface)', border: '1px solid var(--accent)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <span className="text-xl">🌅</span> Morning Briefing
                </h4>
                <button onClick={() => { setBriefingText(null); window.speechSynthesis?.cancel(); }}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-50 hover:opacity-100"
                    style={{ background: 'var(--surface2)', color: 'var(--text)' }}>
                    ✕
                </button>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                {briefingText}
            </p>
        </div>
    );
}
