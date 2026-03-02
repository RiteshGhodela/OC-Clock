'use client';

import { useEffect, useRef, useState } from 'react';
import { useAlarmStore } from '@/hooks/useAlarmStore';
import { useCalendarStore } from '@/hooks/useCalendarStore';
import { useDiaryStore } from '@/hooks/useDiaryStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function MorningBriefingListener() {
    const { alarms } = useAlarmStore();
    const { getDay } = useCalendarStore();
    const { entries } = useDiaryStore();
    const [briefingText, setBriefingText] = useState<string | null>(null);
    const [ringingAlarm, setRingingAlarm] = useState<{ time: string, dateStr: string } | null>(null);
    const [loadingBriefing, setLoadingBriefing] = useState(false);
    const lastTriggered = useRef<string>('');

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const checkAlarms = () => {
            if (ringingAlarm) return; // already ringing
            const now = new Date();
            const timeStr = now.toTimeString().slice(0, 5); // HH:MM
            const dateStr = now.toISOString().split('T')[0];
            const triggerKey = `${dateStr}-${timeStr}`;

            if (lastTriggered.current === triggerKey) return;

            const activeAlarm = alarms.find(a => a.active && a.time === timeStr);
            if (activeAlarm) {
                lastTriggered.current = triggerKey;
                setRingingAlarm({ time: timeStr, dateStr });

                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification('⏰ Alarm Ringing!', { body: `It's ${timeStr}. Click to play your Morning Briefing.` });
                }
            }
        };

        const triggerBriefing = async (dateKey: string) => {
            setLoadingBriefing(true);
            try {
                const todayData = getDay(dateKey);
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
                        setRingingAlarm(null);
                        setBriefingText(data.briefing);
                        playAudio(data.briefing);
                    }
                }
            } catch (err) {
                console.error("Failed to trigger briefing:", err);
            } finally {
                setLoadingBriefing(false);
            }
        };

        const playAudio = (text: string) => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'en-US';
                utterance.rate = 0.95;
                utterance.pitch = 1.0;
                window.speechSynthesis.speak(utterance);
            }
        };

        if (ringingAlarm && !loadingBriefing) {
            // we expose triggerBriefing to the outer scope via a ref if needed, but since it's 
            // tied to the UI click, we can just move it out or return a UI block here.
        }

        const interval = setInterval(checkAlarms, 1000); // Check every second for better precision
        return () => clearInterval(interval);
    }, [alarms, getDay, entries, ringingAlarm, loadingBriefing]);

    const handleWakeUp = async () => {
        if (!ringingAlarm) return;
        setLoadingBriefing(true);
        try {
            const todayData = getDay(ringingAlarm.dateStr);
            const recentDiary = [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
            const res = await fetch('/api/briefing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dateKey: ringingAlarm.dateStr,
                    events: todayData.events || [],
                    notes: todayData.notes || [],
                    diaryEntries: recentDiary,
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.briefing) {
                    setBriefingText(data.briefing);
                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(data.briefing);
                        utterance.lang = 'en-US';
                        utterance.rate = 0.95;
                        window.speechSynthesis.speak(utterance);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingBriefing(false);
            setRingingAlarm(null);
        }
    };

    if (!briefingText && !ringingAlarm) return null;

    return (
        <AnimatePresence>
            {ringingAlarm && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
                    <div className="flex flex-col items-center justify-center p-10 rounded-3xl glass-panel text-center max-w-sm w-full"
                        style={{ border: '1px solid var(--accent)', boxShadow: '0 0 40px var(--accent-glow)' }}>
                        <span className="text-6xl mb-4 animate-bounce">⏰</span>
                        <h2 className="text-4xl font-mono font-bold mb-2 text-white">{ringingAlarm.time}</h2>
                        <p className="text-lg text-white/70 mb-8">Alarm is ringing!</p>

                        <button onClick={handleWakeUp} disabled={loadingBriefing}
                            className="w-full py-4 px-6 rounded-2xl text-lg font-bold text-black transition-all hover:scale-105 active:scale-95 flex justify-center items-center"
                            style={{ background: 'var(--accent)' }}>
                            {loadingBriefing ? 'Generating AI Briefing...' : 'Stop & Play Briefing'}
                        </button>
                    </div>
                </motion.div>
            )}

            {briefingText && !ringingAlarm && (
                <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-6 right-6 z-50 max-w-sm p-6 rounded-3xl shadow-2xl themed-transition"
                    style={{ background: 'var(--surface)', border: '1px solid var(--accent)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                            <span className="text-xl">🌅</span> Morning Briefing
                        </h4>
                        <button onClick={() => { setBriefingText(null); window.speechSynthesis?.cancel(); }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs transition-opacity opacity-50 hover:opacity-100 bg-white/10 dark:bg-black/10"
                            style={{ color: 'var(--text)' }}>
                            ✕
                        </button>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                        {briefingText}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
