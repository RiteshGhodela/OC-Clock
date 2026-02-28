'use client';

import { useEffect, useState } from 'react';
import { getTimeParts, formatDate, pad } from '@/lib/time';

interface Props {
    timezone: string;
}

export default function Android16Clock({ timezone }: Props) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const { hours, minutes, seconds } = getTimeParts(now, timezone);
    const dateStr = formatDate(now, timezone);

    // Second arc: 0-360 degrees
    const secondDeg = (seconds / 60) * 360;
    const r = 120;
    const cx = 130;
    const cy = 130;
    const circumference = 2 * Math.PI * r;
    const dashOffset = circumference * (1 - seconds / 60);

    const isAM = hours < 12;
    const displayHour = hours % 12 || 12;

    return (
        <div className="flex flex-col items-center gap-6 select-none">
            {/* Date chip */}
            <div className="px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase"
                style={{
                    background: 'var(--surface2)',
                    color: 'var(--text-dim)',
                    border: '1px solid var(--border2)',
                }}>
                {dateStr}
            </div>

            {/* Circular second arc + time */}
            <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
                {/* Background ring */}
                <svg className="absolute inset-0" width="260" height="260">
                    <circle
                        cx={cx} cy={cy} r={r}
                        fill="none"
                        stroke="var(--border2)"
                        strokeWidth="3"
                    />
                    {/* Second arc */}
                    <circle
                        cx={cx} cy={cy} r={r}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        transform={`rotate(-90 ${cx} ${cy})`}
                        className="arc-glow"
                        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                    />
                    {/* Second dot */}
                    {(() => {
                        const angle = (secondDeg - 90) * (Math.PI / 180);
                        const x = cx + r * Math.cos(angle);
                        const y = cy + r * Math.sin(angle);
                        return (
                            <circle cx={x} cy={y} r="6"
                                fill="var(--accent)"
                                style={{ filter: 'drop-shadow(0 0 8px var(--accent))' }}
                            />
                        );
                    })()}
                </svg>

                {/* Time display */}
                <div className="flex flex-col items-center z-10">
                    <div className="flex items-end leading-none gap-1">
                        <span className="font-display font-black tabular-nums"
                            style={{ fontSize: 'clamp(4rem,14vw,6rem)', color: 'var(--text)', letterSpacing: '-0.04em' }}>
                            {pad(displayHour)}
                        </span>
                        <span className="font-display font-thin pb-2"
                            style={{ fontSize: 'clamp(3rem,10vw,4.5rem)', color: 'var(--accent)' }}>
                            :
                        </span>
                        <span className="font-display font-black tabular-nums"
                            style={{ fontSize: 'clamp(4rem,14vw,6rem)', color: 'var(--text)', letterSpacing: '-0.04em' }}>
                            {pad(minutes)}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="font-mono text-sm" style={{ color: 'var(--text-dim)' }}>
                            :{pad(seconds)}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--accent)', color: '#000' }}>
                            {isAM ? 'AM' : 'PM'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Timezone + gradient pill */}
            <div className="flex items-center gap-4">
                <div className="h-px flex-1 w-16" style={{ background: 'var(--border2)' }} />
                <span className="text-xs font-mono tracking-widest uppercase opacity-60"
                    style={{ color: 'var(--text-dim)' }}>
                    {timezone}
                </span>
                <div className="h-px flex-1 w-16" style={{ background: 'var(--border2)' }} />
            </div>

            {/* Material You day pills */}
            <div className="flex gap-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => {
                    // Bug 5 fix: use `now` state (not a fresh new Date()) so the
                    // weekday is consistent with the displayed time.
                    const today = now.getDay();
                    const isToday = i === today;
                    return (
                        <div key={i}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                                background: isToday ? 'var(--accent)' : 'var(--surface2)',
                                color: isToday ? '#000' : 'var(--text-dim)',
                                boxShadow: isToday ? '0 0 16px var(--accent-glow)' : 'none',
                            }}>
                            {d}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
