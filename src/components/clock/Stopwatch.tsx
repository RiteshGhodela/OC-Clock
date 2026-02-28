'use client';

import { useState, useRef, useEffect } from 'react';
import { formatMs } from '@/lib/time';

export default function Stopwatch() {
    const [elapsed, setElapsed] = useState(0);
    const [running, setRunning] = useState(false);
    const [laps, setLaps] = useState<{ label: string; time: number; split: number }[]>([]);
    const startRef = useRef<number>(0);
    const baseRef = useRef<number>(0);
    const rafRef = useRef<number>(0);

    // Bug 7 fix: store tick in a ref so all RAF iterations always call the
    // latest version, preventing stale closures and RAF chain accumulation.
    const tickRef = useRef<() => void>(() => { });
    tickRef.current = () => {
        setElapsed(baseRef.current + (Date.now() - startRef.current));
        rafRef.current = requestAnimationFrame(tickRef.current);
    };

    const start = () => {
        startRef.current = Date.now();
        setRunning(true);
        rafRef.current = requestAnimationFrame(tickRef.current);
    };

    const stop = () => {
        cancelAnimationFrame(rafRef.current);
        baseRef.current = elapsed;
        setRunning(false);
    };

    const reset = () => {
        cancelAnimationFrame(rafRef.current);
        setRunning(false);
        setElapsed(0);
        setLaps([]);
        baseRef.current = 0;
    };

    const lap = () => {
        const last = laps.length > 0 ? laps[laps.length - 1].time : 0;
        setLaps(prev => [
            ...prev,
            {
                label: `Lap ${prev.length + 1}`,
                time: elapsed,
                split: elapsed - last,
            },
        ]);
    };

    useEffect(() => {
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    const [h, m, s, cs] = (() => {
        const totalS = Math.floor(elapsed / 1000);
        const H = Math.floor(totalS / 3600);
        const M = Math.floor((totalS % 3600) / 60);
        const S = totalS % 60;
        const CS = Math.floor((elapsed % 1000) / 10);
        return [H, M, S, CS];
    })();
    const pad = (n: number, d = 2) => String(n).padStart(d, '0');

    return (
        <div className="flex flex-col items-center gap-6 py-6">
            {/* Main display */}
            <div className="font-mono font-thin tabular-nums text-center"
                style={{ color: 'var(--text)' }}>
                <span style={{ fontSize: 'clamp(3.5rem,12vw,6rem)', letterSpacing: '-0.04em' }}>
                    {pad(h)}:{pad(m)}:{pad(s)}
                </span>
                <span className="text-3xl opacity-60">.{pad(cs)}</span>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
                {!running ? (
                    <button onClick={start}
                        className="px-8 py-3 rounded-2xl font-semibold text-sm transition-all hover:brightness-110"
                        style={{ background: 'var(--accent)', color: '#000' }}>
                        {elapsed === 0 ? 'Start' : 'Resume'}
                    </button>
                ) : (
                    <button onClick={stop}
                        className="px-8 py-3 rounded-2xl font-semibold text-sm"
                        style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)' }}>
                        Stop
                    </button>
                )}
                {running && (
                    <button onClick={lap}
                        className="px-8 py-3 rounded-2xl font-semibold text-sm"
                        style={{ background: 'var(--surface2)', color: 'var(--accent)', border: '1px solid var(--border2)' }}>
                        Lap
                    </button>
                )}
                {!running && elapsed > 0 && (
                    <button onClick={reset}
                        className="px-8 py-3 rounded-2xl font-semibold text-sm"
                        style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                        Reset
                    </button>
                )}
            </div>

            {/* Lap list */}
            {laps.length > 0 && (
                <div className="w-full max-w-md max-h-52 overflow-y-auto rounded-2xl"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                    {[...laps].reverse().map((lap, i) => (
                        <div key={i}
                            className="flex items-center justify-between px-4 py-3 text-sm font-mono"
                            style={{ borderBottom: i < laps.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <span style={{ color: 'var(--text-dim)' }}>{lap.label}</span>
                            <span style={{ color: 'var(--text)' }}>{formatMs(lap.time)}</span>
                            <span style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>+{formatMs(lap.split)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
