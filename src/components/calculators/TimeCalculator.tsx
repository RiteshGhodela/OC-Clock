'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

type Mode = 'duration' | 'convert' | 'timezone';

const UNITS = [
    { label: 'Seconds', factor: 1 },
    { label: 'Minutes', factor: 60 },
    { label: 'Hours', factor: 3600 },
    { label: 'Days', factor: 86400 },
    { label: 'Weeks', factor: 604800 },
    { label: 'Months', factor: 2629800 },
    { label: 'Years', factor: 31557600 },
];

const TIMEZONES = Intl.supportedValuesOf
    ? Intl.supportedValuesOf('timeZone').slice(0, 80)
    : ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'];

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2.5 px-4 rounded-xl"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{label}</span>
            <span className="font-mono text-sm font-semibold" style={{ color: 'var(--text)' }}>{value}</span>
        </div>
    );
}

export default function TimeCalculator() {
    const [mode, setMode] = useState<Mode>('duration');

    // Duration
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');

    // Convert
    const [amount, setAmount] = useState('');
    const [fromUnit, setFromUnit] = useState(2); // hours index
    const [toUnit, setToUnit] = useState(1);     // minutes index

    // Timezone
    const [tz1, setTz1] = useState('UTC');
    const [tz2, setTz2] = useState('Asia/Kolkata');

    const selectClass = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none themed-transition';
    const selectStyle = { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)' };
    const inputStyle = { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)' };

    const fmt = (n: number): string => {
        if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
        if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
        if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
        return n.toFixed(4).replace(/\.?0+$/, '');
    };

    // Duration calc
    let diffSec = 0;
    if (start && end) {
        const s = new Date(start), e = new Date(end);
        if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
            diffSec = Math.abs((e.getTime() - s.getTime()) / 1000);
        }
    }

    // Convert calc
    const convertedValue = amount
        ? parseFloat(amount) * UNITS[fromUnit].factor / UNITS[toUnit].factor
        : null;

    // Timezone display
    const now = new Date();
    const tzTime = (tz: string) => now.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const tzDate = (tz: string) => now.toLocaleDateString('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' });

    return (
        <div className="flex flex-col gap-5">
            {/* Mode tabs */}
            <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface2)' }}>
                {(['duration', 'convert', 'timezone'] as Mode[]).map(m => (
                    <button key={m} onClick={() => setMode(m)}
                        className="flex-1 py-2 rounded-xl text-xs font-medium capitalize themed-transition"
                        style={mode === m ? { background: 'var(--accent)', color: '#000' } : { color: 'var(--text-dim)' }}>
                        {m}
                    </button>
                ))}
            </div>

            {mode === 'duration' && (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Start</label>
                            <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                        </div>
                        <div>
                            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-dim)' }}>End</label>
                            <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                        </div>
                    </div>
                    {diffSec > 0 && (
                        <motion.div className="flex flex-col gap-2"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            {UNITS.map(u => (
                                <Row key={u.label} label={u.label} value={fmt(diffSec / u.factor)} />
                            ))}
                        </motion.div>
                    )}
                </div>
            )}

            {mode === 'convert' && (
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Amount</label>
                        <input type="number" placeholder="e.g. 2.5" value={amount} onChange={e => setAmount(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl text-sm outline-none" style={inputStyle} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-dim)' }}>From</label>
                            <select value={fromUnit} onChange={e => setFromUnit(Number(e.target.value))}
                                className={selectClass} style={selectStyle}>
                                {UNITS.map((u, i) => <option key={u.label} value={i}>{u.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-dim)' }}>To</label>
                            <select value={toUnit} onChange={e => setToUnit(Number(e.target.value))}
                                className={selectClass} style={selectStyle}>
                                {UNITS.map((u, i) => <option key={u.label} value={i}>{u.label}</option>)}
                            </select>
                        </div>
                    </div>
                    {convertedValue !== null && (
                        <motion.div className="text-center py-4 rounded-2xl"
                            style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <p className="text-4xl font-black font-mono" style={{ color: 'var(--accent)' }}>{fmt(convertedValue)}</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>{UNITS[toUnit].label}</p>
                        </motion.div>
                    )}
                </div>
            )}

            {mode === 'timezone' && (
                <div className="flex flex-col gap-4">
                    {[['Zone 1', tz1, setTz1], ['Zone 2', tz2, setTz2]].map(([label, val, setter]) => (
                        <div key={label as string}>
                            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-dim)' }}>{label as string}</label>
                            <select value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)}
                                className={selectClass} style={selectStyle}>
                                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                            </select>
                            <div className="mt-2 px-4 py-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
                                <p className="text-xl font-mono font-bold" style={{ color: 'var(--accent)' }}>{tzTime(val as string)}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{tzDate(val as string)} · {val as string}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
