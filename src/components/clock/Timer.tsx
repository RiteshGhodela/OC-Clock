'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function Timer() {
    const [inputH, setInputH] = useState(0);
    const [inputM, setInputM] = useState(5);
    const [inputS, setInputS] = useState(0);
    const [totalMs, setTotalMs] = useState(0);
    const [remainingMs, setRemainingMs] = useState(0);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const endTimeRef = useRef<number>(0);

    const totalSet = (inputH * 3600 + inputM * 60 + inputS) * 1000;
    const progress = totalMs > 0 ? (1 - remainingMs / totalMs) : 0;
    const r = 100;
    const circumference = 2 * Math.PI * r;

    const playBeep = useCallback(() => {
        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 1);
            // Bug 6 fix: close the AudioContext after the sound finishes to prevent leaks.
            osc.onended = () => ctx.close();
        } catch { /* ignore */ }
    }, []);

    const start = () => {
        const ms = totalSet;
        if (ms <= 0) return;
        setTotalMs(ms);
        setRemainingMs(ms);
        setDone(false);
        setRunning(true);
        endTimeRef.current = Date.now() + ms;
    };

    const pause = () => {
        setRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const resume = () => {
        endTimeRef.current = Date.now() + remainingMs;
        setRunning(true);
    };

    const reset = () => {
        setRunning(false);
        setDone(false);
        setRemainingMs(0);
        setTotalMs(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                const left = endTimeRef.current - Date.now();
                if (left <= 0) {
                    setRemainingMs(0);
                    setRunning(false);
                    setDone(true);
                    playBeep();
                    if (intervalRef.current) clearInterval(intervalRef.current);
                } else {
                    setRemainingMs(left);
                }
            }, 100);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [running, playBeep]);

    const displayMs = remainingMs > 0 ? remainingMs : totalSet;
    const dH = Math.floor(displayMs / 3600000);
    const dM = Math.floor((displayMs % 3600000) / 60000);
    const dS = Math.floor((displayMs % 60000) / 1000);
    const pad = (n: number) => String(n).padStart(2, '0');

    return (
        <div className="flex flex-col items-center gap-8 py-6">
            {/* SVG Progress ring */}
            <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
                <svg width="240" height="240">
                    <circle cx="120" cy="120" r={r} fill="none" stroke="var(--border2)" strokeWidth="8" />
                    <circle
                        cx="120" cy="120" r={r}
                        fill="none"
                        stroke={done ? '#22c55e' : 'var(--accent)'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - progress)}
                        transform="rotate(-90 120 120)"
                        style={{ transition: 'stroke-dashoffset 0.2s ease, stroke 0.5s' }}
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    {done ? (
                        <span className="text-4xl">✅</span>
                    ) : (
                        <span className="font-mono text-4xl font-light tabular-nums"
                            style={{ color: 'var(--text)' }}>
                            {pad(dH)}:{pad(dM)}:{pad(dS)}
                        </span>
                    )}
                    {done && <p className="text-sm mt-1" style={{ color: '#22c55e' }}>Done!</p>}
                </div>
            </div>

            {/* Inputs (hidden while running) */}
            {!running && remainingMs === 0 && (
                <div className="flex items-center gap-3">
                    {[
                        { label: 'H', value: inputH, set: setInputH, max: 23 },
                        { label: 'M', value: inputM, set: setInputM, max: 59 },
                        { label: 'S', value: inputS, set: setInputS, max: 59 },
                    ].map(({ label, value, set, max }) => (
                        <div key={label} className="flex flex-col items-center gap-1">
                            <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>{label}</span>
                            <input
                                type="number"
                                min={0} max={max}
                                value={value}
                                onChange={e => set(Math.min(max, Math.max(0, Number(e.target.value))))}
                                className="w-16 text-center text-2xl font-mono font-light rounded-xl py-2 outline-none"
                                style={{
                                    background: 'var(--surface2)',
                                    color: 'var(--text)',
                                    border: '1px solid var(--border2)',
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Controls */}
            <div className="flex gap-3">
                {!running && remainingMs === 0 && !done && (
                    <button onClick={start}
                        className="px-8 py-3 rounded-2xl font-semibold text-sm transition-all hover:brightness-110"
                        style={{ background: 'var(--accent)', color: '#000' }}>
                        Start
                    </button>
                )}
                {running && (
                    <button onClick={pause}
                        className="px-8 py-3 rounded-2xl font-semibold text-sm"
                        style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)' }}>
                        Pause
                    </button>
                )}
                {!running && remainingMs > 0 && (
                    <button onClick={resume}
                        className="px-8 py-3 rounded-2xl font-semibold text-sm"
                        style={{ background: 'var(--accent)', color: '#000' }}>
                        Resume
                    </button>
                )}
                {(running || remainingMs > 0 || done) && (
                    <button onClick={reset}
                        className="px-8 py-3 rounded-2xl font-semibold text-sm"
                        style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)' }}>
                        Reset
                    </button>
                )}
            </div>
        </div>
    );
}
