'use client';

import { useState } from 'react';
import { useCalendarStore } from '@/hooks/useCalendarStore';
import { formatCalendarKey } from '@/lib/time';
import DayModal from './DayModal';
import clsx from 'clsx';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarPage() {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [fullscreen, setFullscreen] = useState(false);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const { store, getDay, toggleTick, addNote, removeNote } = useCalendarStore();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const isToday = (d: number) =>
        d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const gridContent = (
        <div className="flex flex-col gap-4 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button onClick={prevMonth}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm themed-transition hover:opacity-80 shrink-0"
                    style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)' }}>
                    ‹
                </button>
                <div className="text-center">
                    <h2 className="text-lg font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>
                        {MONTHS[month]} {year}
                    </h2>
                </div>
                <button onClick={nextMonth}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm themed-transition hover:opacity-80 shrink-0"
                    style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)' }}>
                    ›
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1">
                {DAYS.map(d => (
                    <div key={d} className="text-center text-xs font-medium py-1"
                        style={{ color: 'var(--text-dim)' }}>
                        {d}
                    </div>
                ))}
                {/* Day cells */}
                {cells.map((d, i) => {
                    if (!d) return <div key={`empty-${i}`} />;
                    const key = formatCalendarKey(year, month, d);
                    const dayData = getDay(key);
                    const isTicked = dayData.ticked;
                    const hasNotes = dayData.notes.length > 0;

                    return (
                        <button
                            key={key}
                            onClick={() => setSelectedKey(key)}
                            className={clsx(
                                'relative flex flex-col items-center justify-center rounded-2xl themed-transition hover:brightness-125',
                                fullscreen ? 'aspect-square text-base' : 'h-12 text-sm',
                                isToday(d) ? 'today-cell' : ''
                            )}
                            style={{
                                background: isToday(d)
                                    ? 'var(--accent)'
                                    : isTicked
                                        ? 'var(--surface2)'
                                        : 'transparent',
                                color: isToday(d) ? '#000' : 'var(--text)',
                                border: isTicked && !isToday(d) ? '1px solid var(--accent)' : '1px solid transparent',
                            }}
                        >
                            <span className="font-medium">{d}</span>
                            {/* Indicators */}
                            <div className="absolute bottom-1 flex gap-0.5">
                                {isTicked && (
                                    <span style={{ fontSize: '0.45rem', color: isToday(d) ? '#000' : 'var(--accent)' }}>✓</span>
                                )}
                                {hasNotes && (
                                    <span className="w-1 h-1 rounded-full"
                                        style={{ background: isToday(d) ? '#000' : 'var(--accent)' }} />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs" style={{ color: 'var(--text-dim)' }}>
                <span className="flex items-center gap-1">
                    <span style={{ color: 'var(--accent)' }}>✓</span> Ticked
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--accent)' }} /> Note
                </span>
            </div>
        </div>
    );

    if (fullscreen) {
        return (
            <div className="fullscreen-overlay themed-bg p-8 flex flex-col" style={{ background: 'var(--bg)' }}>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>📅 Calendar</h1>
                    <button onClick={() => setFullscreen(false)}
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                        ✕
                    </button>
                </div>
                <div className="flex-1">{gridContent}</div>

                {selectedKey && (
                    <DayModal
                        dateKey={selectedKey}
                        onClose={() => setSelectedKey(null)}
                        dayData={getDay(selectedKey)}
                        onToggleTick={() => toggleTick(selectedKey)}
                        onAddNote={(text) => addNote(selectedKey, text)}
                        onRemoveNote={(id) => removeNote(selectedKey, id)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 sm:px-8 py-10 w-full overflow-hidden">
            <div className="max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 w-full">
                    <h1 className="text-xl font-semibold shrink-0" style={{ color: 'var(--text)' }}>📅 Calendar</h1>
                    <button onClick={() => setFullscreen(true)}
                        className="px-4 py-2 rounded-xl text-xs font-medium themed-transition shrink-0"
                        style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                        ⛶ Full Screen
                    </button>
                </div>

                <div className="rounded-3xl p-4 sm:p-6 themed-transition w-full overflow-hidden"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    {gridContent}
                </div>

                {selectedKey && (
                    <DayModal
                        dateKey={selectedKey}
                        onClose={() => setSelectedKey(null)}
                        dayData={getDay(selectedKey)}
                        onToggleTick={() => toggleTick(selectedKey)}
                        onAddNote={(text) => addNote(selectedKey, text)}
                        onRemoveNote={(id) => removeNote(selectedKey, id)}
                    />
                )}
            </div>
        </div>
    );
}
