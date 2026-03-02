'use client';

import { useState } from 'react';
import { useAlarmStore } from '@/hooks/useAlarmStore';

export default function AlarmClock() {
    const { alarms, addAlarm, toggleAlarm, removeAlarm } = useAlarmStore();
    const [newTime, setNewTime] = useState('07:00');

    const handleAdd = () => {
        // block duplicates
        if (alarms.some(a => a.time === newTime)) return;
        addAlarm(newTime);
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-sm mx-auto p-6 rounded-3xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-xl font-semibold text-center" style={{ color: 'var(--text)' }}>⏰ Alarms</h2>

            {/* Add Alarm Form */}
            <div className="flex gap-2 items-center p-3 rounded-2xl" style={{ background: 'var(--surface2)' }}>
                <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="flex-1 bg-transparent text-lg font-mono outline-none text-center"
                    style={{ color: 'var(--text)', appearance: 'none', WebkitAppearance: 'none' }}
                />
                <button
                    onClick={handleAdd}
                    className="px-4 py-2 rounded-xl text-sm font-semibold themed-transition"
                    style={{ background: 'var(--accent)', color: '#000' }}>
                    Add
                </button>
            </div>

            {/* Alarms List */}
            <div className="flex flex-col gap-3">
                {alarms.length === 0 ? (
                    <p className="text-center text-sm mt-4 opacity-50" style={{ color: 'var(--text-dim)' }}>No alarms set.</p>
                ) : (
                    [...alarms].sort((a, b) => a.time.localeCompare(b.time)).map(alarm => (
                        <div key={alarm.id} className="flex items-center justify-between p-4 rounded-2xl themed-transition"
                            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-mono" style={{ color: alarm.active ? 'var(--text)' : 'var(--text-dim)', textDecoration: alarm.active ? 'none' : 'line-through' }}>
                                    {alarm.time}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleAlarm(alarm.id)}
                                    className="w-12 h-6 rounded-full relative themed-transition"
                                    style={{ background: alarm.active ? 'var(--accent)' : 'var(--border2)' }}>
                                    <span className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                                        style={{ left: alarm.active ? 'calc(100% - 20px)' : '4px', background: alarm.active ? '#000' : 'var(--text-dim)' }} />
                                </button>
                                <button
                                    onClick={() => removeAlarm(alarm.id)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full opacity-50 hover:opacity-100 themed-transition"
                                    style={{ color: 'var(--text-dim)', background: 'var(--surface)' }}>
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {alarms.length > 0 && (
                <p className="text-xs text-center mt-2 opacity-60" style={{ color: 'var(--text-dim)' }}>
                    When the first alarm goes off, a Morning Briefing will be triggered.
                </p>
            )}
        </div>
    );
}
