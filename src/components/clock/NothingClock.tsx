'use client';

import { useEffect, useState } from 'react';
import { getTimeParts, formatDate, getUserTimezone } from '@/lib/time';
import { pad } from '@/lib/time';

interface Props {
    timezone: string;
    hourFormat?: '12' | '24';
}

export default function NothingClock({ timezone, hourFormat = '24' }: Props) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const { hours, minutes, seconds } = getTimeParts(now, timezone);
    const dateStr = formatDate(now, timezone);
    const isAM = hours < 12;
    const displayHour = hourFormat === '12' ? (hours % 12 || 12) : hours;
    const h = pad(displayHour);
    const m = pad(minutes);
    const s = pad(seconds);

    // Dot rows for glyph effect
    const rows = 4;

    return (
        <div className="flex flex-col items-center gap-8 select-none">
            {/* Date */}
            <p className="text-sm font-mono tracking-[0.3em] uppercase opacity-50"
                style={{ color: 'var(--text-dim)', letterSpacing: '0.3em' }}>
                {dateStr}
            </p>

            {/* Nothing Phone glyph bars */}
            <div className="flex flex-col gap-1 w-72">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="h-[3px] rounded-full overflow-hidden"
                        style={{ background: 'var(--surface2)' }}>
                        <div
                            className="h-full rounded-full"
                            style={{
                                background: 'var(--accent)',
                                width: `${[85, 60, 40, 25][i]}%`,
                                boxShadow: '0 0 8px var(--accent)',
                                animation: `glyphScan ${1.5 + i * 0.3}s ease-in-out infinite`,
                                animationDelay: `${i * 0.2}s`,
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Main time display */}
            <div className="flex items-center gap-2">
                {/* Hours */}
                <span className="font-mono font-light text-[clamp(5rem,18vw,10rem)] leading-none tabular-nums"
                    style={{ color: 'var(--text)', letterSpacing: '-0.04em' }}>
                    {h}
                </span>

                {/* Colon */}
                <span className="nothing-colon font-mono font-light text-[clamp(5rem,18vw,10rem)] leading-none"
                    style={{ color: 'var(--accent)' }}>
                    :
                </span>

                {/* Minutes */}
                <span className="font-mono font-light text-[clamp(5rem,18vw,10rem)] leading-none tabular-nums"
                    style={{ color: 'var(--text)', letterSpacing: '-0.04em' }}>
                    {m}
                </span>
            </div>

            {/* Seconds bar + AM/PM */}
            <div className="flex items-center gap-6">
                {/* Seconds progress */}
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-mono opacity-40" style={{ color: 'var(--text-dim)' }}>SEC</span>
                    <div className="flex gap-[3px]">
                        {Array.from({ length: 60 }).map((_, i) => (
                            <div key={i}
                                className="w-[3px] h-4 rounded-full"
                                style={{
                                    background: i < seconds ? 'var(--accent)' : 'var(--border2)',
                                    boxShadow: i < seconds ? '0 0 4px var(--accent)' : 'none',
                                    transition: 'background 0.3s ease',
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom row: seconds numeric + AM/PM + timezone */}
            <div className="flex items-center gap-8 text-sm font-mono"
                style={{ color: 'var(--text-dim)' }}>
                <span>:{s}</span>
                {hourFormat === '12' && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--accent)', color: '#000' }}>
                        {isAM ? 'AM' : 'PM'}
                    </span>
                )}
                <span className="opacity-50">|</span>
                <span className="tracking-widest text-xs opacity-60">{timezone}</span>
            </div>

            {/* Nothing signature dots */}
            <div className="flex gap-2 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full"
                        style={{
                            background: 'var(--accent)',
                            opacity: i === 2 ? 1 : 0.2,
                            animation: `dotPulse ${1 + i * 0.2}s ease-in-out infinite`,
                            animationDelay: `${i * 0.15}s`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
