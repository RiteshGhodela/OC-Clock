'use client';

import { useEffect, useState } from 'react';
import { getTimeParts, formatDate, pad } from '@/lib/time';

interface Props {
    timezone: string;
}

export default function BWClock({ timezone }: Props) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const { hours, minutes, seconds } = getTimeParts(now, timezone);
    const dateStr = formatDate(now, timezone);

    const size = 260;
    const cx = size / 2;
    const cy = size / 2;
    const R = 110;

    const toXY = (deg: number, r: number) => {
        const rad = (deg - 90) * (Math.PI / 180);
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    const hourDeg = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;
    const minuteDeg = (minutes / 60) * 360 + (seconds / 60) * 6;
    const secondDeg = (seconds / 60) * 360;

    const hourHand = toXY(hourDeg, R * 0.55);
    const minuteHand = toXY(minuteDeg, R * 0.78);
    const secondHand = toXY(secondDeg, R * 0.88);
    const secondTail = toXY(secondDeg + 180, R * 0.2);

    const hourMarks = Array.from({ length: 12 }, (_, i) => toXY((i / 12) * 360, R));
    const minuteMarks = Array.from({ length: 60 }, (_, i) => ({
        outer: toXY((i / 60) * 360, R),
        inner: toXY((i / 60) * 360, i % 5 === 0 ? R - 10 : R - 5),
    }));

    return (
        <div className="flex flex-col items-center gap-6 select-none">
            {/* Date */}
            <p className="text-sm font-mono tracking-[0.2em] uppercase"
                style={{ color: 'var(--text-dim)' }}>
                {dateStr}
            </p>

            {/* Analog clock face */}
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size}>
                    {/* Outer ring */}
                    <circle cx={cx} cy={cy} r={R + 4} fill="none" stroke="var(--border2)" strokeWidth="1" />
                    {/* Face */}
                    <circle cx={cx} cy={cy} r={R} fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />

                    {/* Minute tick marks */}
                    {minuteMarks.map((m, i) => (
                        <line key={i}
                            x1={m.outer.x} y1={m.outer.y}
                            x2={m.inner.x} y2={m.inner.y}
                            stroke={i % 5 === 0 ? 'var(--accent)' : 'var(--border2)'}
                            strokeWidth={i % 5 === 0 ? 2 : 1}
                        />
                    ))}

                    {/* Hour numbers */}
                    {hourMarks.map((p, i) => {
                        const label = i === 0 ? 12 : i;
                        const numPos = toXY((i / 12) * 360, R - 22);
                        return (
                            <text key={i}
                                x={numPos.x} y={numPos.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize="10"
                                fontFamily="Roboto Mono, monospace"
                                fontWeight="500"
                                fill="var(--text)"
                            >
                                {label}
                            </text>
                        );
                    })}

                    {/* Hour hand */}
                    <line
                        x1={cx} y1={cy}
                        x2={hourHand.x} y2={hourHand.y}
                        stroke="var(--accent)"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                    {/* Minute hand */}
                    <line
                        x1={cx} y1={cy}
                        x2={minuteHand.x} y2={minuteHand.y}
                        stroke="var(--text)"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    {/* Second hand + tail */}
                    <line
                        x1={secondTail.x} y1={secondTail.y}
                        x2={secondHand.x} y2={secondHand.y}
                        stroke="var(--accent)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        style={{ transition: 'none' }}
                    />
                    {/* Center dot */}
                    <circle cx={cx} cy={cy} r="5" fill="var(--accent)" />
                    <circle cx={cx} cy={cy} r="2" fill="var(--bg)" />
                </svg>
            </div>

            {/* Digital time */}
            <div className="font-mono text-3xl font-light tracking-widest"
                style={{ color: 'var(--text-dim)' }}>
                {pad(hours)}:{pad(minutes)}
                <span className="text-lg opacity-60">:{pad(seconds)}</span>
            </div>

            <p className="text-xs font-mono tracking-widest opacity-40"
                style={{ color: 'var(--text-dim)' }}>
                {timezone}
            </p>
        </div>
    );
}
