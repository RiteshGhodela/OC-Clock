'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/context/SettingsContext';

// ── Types ───────────────────────────────────────────────────────────────────
type ClockSize = 'sm' | 'md' | 'lg' | 'xl';
type HourFormat = '12' | '24';

interface TimeState {
    h: number;   // 0-23
    m: number;
    s: number;
    ms: number;
    h12: number; // 1-12
    ampm: 'AM' | 'PM';
    dateStr: string;
    dayStr: string;
}

function useTime(): TimeState {
    const [t, setT] = useState<TimeState>(() => getTimeState());
    useEffect(() => {
        const id = setInterval(() => setT(getTimeState()), 50);
        return () => clearInterval(id);
    }, []);
    return t;
}

function getTimeState(): TimeState {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds(), ms = now.getMilliseconds();
    return {
        h, m, s, ms,
        h12: h % 12 || 12,
        ampm: h < 12 ? 'AM' : 'PM',
        dateStr: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dayStr: now.toLocaleDateString('en-US', { weekday: 'long' }),
    };
}

const pad = (n: number, d = 2) => String(n).padStart(d, '0');

// ── Size config ─────────────────────────────────────────────────────────────
const SIZE_MAP: Record<ClockSize, { scale: number; label: string }> = {
    sm: { scale: 0.7, label: 'Small' },
    md: { scale: 1.0, label: 'Medium' },
    lg: { scale: 1.35, label: 'Large' },
    xl: { scale: 1.7, label: 'XL' },
};

// ============================================================================
// CLOCK 1 — DIGITAL (7-segment LED)
// ============================================================================
function DigitalClock({ t, fmt }: { t: TimeState; fmt: HourFormat }) {
    const h = fmt === '12' ? t.h12 : t.h;
    return (
        <div style={{ fontFamily: '"Courier New", monospace', background: '#0a0a0a', borderRadius: 16, padding: '24px 36px', display: 'inline-block', boxShadow: '0 0 40px rgba(255,60,0,0.3), inset 0 0 20px rgba(0,0,0,0.8)', border: '2px solid #1a1a1a' }}>
            <div style={{ fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 900, letterSpacing: 4, color: '#ff3c00', textShadow: '0 0 20px #ff3c00, 0 0 40px #ff6020', lineHeight: 1 }}>
                {pad(h)}:{pad(t.m)}:{pad(t.s)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: '#ff6020', opacity: 0.7 }}>{t.dateStr}</span>
                {fmt === '12' && <span style={{ fontSize: 14, color: '#ff3c00', fontWeight: 700 }}>{t.ampm}</span>}
            </div>
        </div>
    );
}

// ============================================================================
// CLOCK 2 — ATOMIC (scientific precision)
// ============================================================================
function AtomicClock({ t, fmt }: { t: TimeState; fmt: HourFormat }) {
    const h = fmt === '12' ? t.h12 : t.h;
    return (
        <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 12, padding: '20px 28px', fontFamily: '"Courier New", monospace', display: 'inline-block' }}>
            <div style={{ fontSize: 10, color: '#8b949e', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>◉ Atomic Precision UTC+IST</div>
            <div style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 300, color: '#58d68d', letterSpacing: 2, lineHeight: 1 }}>
                {pad(h)}:{pad(t.m)}:{pad(t.s)}<span style={{ fontSize: '0.4em', color: '#2ecc71', opacity: 0.8 }}>.{pad(t.ms, 3)}</span>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[['HH', pad(h)], ['MM', pad(t.m)], ['SS', pad(t.s)]].map(([label, val]) => (
                    <div key={label} style={{ textAlign: 'center', background: '#161b22', borderRadius: 6, padding: '6px 4px' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#58d68d' }}>{val}</div>
                        <div style={{ fontSize: 9, color: '#8b949e', marginTop: 2 }}>{label}</div>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 9, color: '#3fb950', opacity: 0.6, textAlign: 'center' }}>SYNCHRONIZED · DRIFT &lt; 1ns</div>
        </div>
    );
}

// ============================================================================
// CLOCK 3 — ANALOG SVG (classic watch face)
// ============================================================================
function AnalogClock({ t }: { t: TimeState }) {
    const R = 110;
    const cx = R, cy = R;
    const hAngle = ((t.h % 12) + t.m / 60) * 30 - 90;
    const mAngle = (t.m + t.s / 60) * 6 - 90;
    const sAngle = t.s * 6 - 90;
    const hand = (angle: number, len: number, width: number, color: string) => {
        const rad = (angle * Math.PI) / 180;
        const x2 = cx + len * Math.cos(rad);
        const y2 = cy + len * Math.sin(rad);
        return <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" />;
    };
    const numerals = Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) * 30 - 90) * (Math.PI / 180);
        const nr = R - 16;
        return { num: i + 1, x: cx + nr * Math.cos(a), y: cy + nr * Math.sin(a) };
    });
    return (
        <svg width={R * 2} height={R * 2} viewBox={`0 0 ${R * 2} ${R * 2}`}>
            <circle cx={cx} cy={cy} r={R - 1} fill="var(--surface)" stroke="var(--border2)" strokeWidth={2} />
            <circle cx={cx} cy={cy} r={R - 10} fill="none" stroke="var(--accent)" strokeWidth={0.5} opacity={0.3} />
            {/* Tick marks */}
            {Array.from({ length: 60 }, (_, i) => {
                const a = i * 6 * (Math.PI / 180);
                const major = i % 5 === 0;
                const r1 = R - (major ? 14 : 9);
                return <line key={i} x1={cx + (R - 4) * Math.cos(a)} y1={cy + (R - 4) * Math.sin(a)}
                    x2={cx + r1 * Math.cos(a)} y2={cy + r1 * Math.sin(a)}
                    stroke={major ? 'var(--text)' : 'var(--text-dim)'} strokeWidth={major ? 2 : 0.8} />;
            })}
            {/* Numerals */}
            {numerals.map(({ num, x, y }) => (
                <text key={num} x={x} y={y} textAnchor="middle" dominantBaseline="central"
                    fontSize={11} fontWeight={600} fill="var(--text)" fontFamily="Georgia, serif">{num}</text>
            ))}
            {hand(hAngle, R * 0.55, 5, 'var(--text)')}
            {hand(mAngle, R * 0.78, 3.5, 'var(--text)')}
            {hand(sAngle, R * 0.85, 1.5, 'var(--accent)')}
            <circle cx={cx} cy={cy} r={5} fill="var(--accent)" />
            <circle cx={cx} cy={cy} r={2} fill="var(--bg)" />
        </svg>
    );
}

// ============================================================================
// CLOCK 4 — ROMAN NUMERAL ANALOG
// ============================================================================
const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
function RomanClock({ t }: { t: TimeState }) {
    const R = 110;
    const cx = R, cy = R;
    const hAngle = ((t.h % 12) + t.m / 60) * 30 - 90;
    const mAngle = (t.m + t.s / 60) * 6 - 90;
    const sAngle = t.s * 6 - 90;
    const hand = (angle: number, len: number, w: number, color: string) => {
        const rad = (angle * Math.PI) / 180;
        return <line x1={cx} y1={cy} x2={cx + len * Math.cos(rad)} y2={cy + len * Math.sin(rad)} stroke={color} strokeWidth={w} strokeLinecap="round" />;
    };
    return (
        <svg width={R * 2} height={R * 2} viewBox={`0 0 ${R * 2} ${R * 2}`}>
            <circle cx={cx} cy={cy} r={R - 1} fill="#f9f6f0" stroke="#8B6914" strokeWidth={3} />
            <circle cx={cx} cy={cy} r={R - 6} fill="none" stroke="#8B6914" strokeWidth={0.5} />
            {ROMAN.map((x, i) => {
                const a = (i * 30 - 90) * (Math.PI / 180);
                const nr = R - 18;
                return <text key={i} x={cx + nr * Math.cos(a)} y={cy + nr * Math.sin(a)}
                    textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={700} fill="#3D2B1F" fontFamily="Georgia, serif">{x}</text>;
            })}
            {Array.from({ length: 60 }, (_, i) => {
                const a = i * 6 * (Math.PI / 180);
                const major = i % 5 === 0;
                const r1 = R - (major ? 10 : 6);
                return <line key={i} x1={cx + (R - 3) * Math.cos(a)} y1={cy + (R - 3) * Math.sin(a)}
                    x2={cx + r1 * Math.cos(a)} y2={cy + r1 * Math.sin(a)}
                    stroke="#8B6914" strokeWidth={major ? 1.5 : 0.6} />;
            })}
            {hand(hAngle, R * 0.52, 4.5, '#1a1a1a')}
            {hand(mAngle, R * 0.74, 3, '#1a1a1a')}
            {hand(sAngle, R * 0.82, 1.5, '#c0392b')}
            <circle cx={cx} cy={cy} r={4} fill="#8B6914" />
            <circle cx={cx} cy={cy} r={1.5} fill="#f9f6f0" />
        </svg>
    );
}

// ============================================================================
// CLOCK 5 — WORD CLOCK (lights up words)
// ============================================================================
const WORDS = [
    ['IT', 'IS', 'A', 'QUARTER', 'HALF'],
    ['TWENTY', 'FIVE', 'TEN', 'MINUTES'],
    ['PAST', 'TO', 'ONE', 'TWO', 'THREE'],
    ['FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'],
    ['NINE', 'TEN', 'ELEVEN', 'TWELVE', "O'CLOCK"],
];

function getActivatedWords(t: TimeState): string[] {
    const active: string[] = ['IT', 'IS'];
    const names = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE'];
    let m = t.m, h = t.h % 12;
    if (m === 0) { active.push(names[h] ?? 'TWELVE'); active.push("O'CLOCK"); }
    else if (m <= 30) {
        if (m === 5) active.push('FIVE', 'MINUTES', 'PAST');
        else if (m === 10) active.push('TEN', 'MINUTES', 'PAST');
        else if (m === 15) active.push('QUARTER', 'PAST');
        else if (m === 20) active.push('TWENTY', 'MINUTES', 'PAST');
        else if (m === 25) active.push('TWENTY', 'FIVE', 'MINUTES', 'PAST');
        else if (m === 30) active.push('HALF', 'PAST');
        else { active.push('PAST'); }
        active.push(names[h] ?? 'TWELVE');
    } else {
        m = 60 - m; h = (h + 1) % 12;
        if (m === 5) active.push('FIVE', 'MINUTES', 'TO');
        else if (m === 10) active.push('TEN', 'MINUTES', 'TO');
        else if (m === 15) active.push('QUARTER', 'TO');
        else if (m === 20) active.push('TWENTY', 'MINUTES', 'TO');
        else if (m === 25) active.push('TWENTY', 'FIVE', 'MINUTES', 'TO');
        else { active.push('TO'); }
        active.push(names[h] ?? 'TWELVE');
    }
    return active;
}

function WordClock({ t }: { t: TimeState }) {
    const active = getActivatedWords(t);
    return (
        <div style={{ background: '#0a0a0a', borderRadius: 16, padding: '20px 24px', display: 'inline-block' }}>
            {WORDS.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    {row.map(word => {
                        const on = active.includes(word);
                        return (
                            <span key={word} style={{
                                fontSize: 13, fontWeight: 700, letterSpacing: 1.5, fontFamily: 'monospace',
                                color: on ? 'var(--accent)' : '#333',
                                textShadow: on ? '0 0 12px var(--accent)' : 'none',
                                transition: 'all 0.3s ease'
                            }}>
                                {word}
                            </span>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// CLOCK 6 — FLIP (electric 60s retro)
// ============================================================================
function FlipCard({ value, prev }: { value: string; prev: string }) {
    const changed = value !== prev;
    return (
        <div style={{ position: 'relative', width: 64, height: 88, perspective: 400 }}>
            <div style={{ width: '100%', height: '100%', background: '#1a1a1a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #333' }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: '#fff', fontFamily: '"Courier New", monospace', lineHeight: 1 }}>{value}</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: '#141414', borderRadius: '0 0 8px 8px', borderTop: '1px solid #000', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4 }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: '#e0e0e0', fontFamily: '"Courier New", monospace', lineHeight: 1 }}>{value}</span>
            </div>
        </div>
    );
}
function FlipClock({ t, fmt }: { t: TimeState; fmt: HourFormat }) {
    const h = fmt === '12' ? t.h12 : t.h;
    const prevRef = useRef<string[]>([pad(h), pad(t.m), pad(t.s)]);
    const prev = prevRef.current;
    useEffect(() => { prevRef.current = [pad(h), pad(t.m), pad(t.s)]; });
    const sep = <div style={{ color: '#555', fontSize: 48, fontWeight: 900, alignSelf: 'center', lineHeight: 1 }}>:</div>;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[pad(h), pad(t.m), pad(t.s)].map((v, i) => (
                <React.Fragment key={i}>{i > 0 && sep}<FlipCard value={v} prev={prev[i]} /></React.Fragment>
            ))}
            {fmt === '12' && <span style={{ fontSize: 16, fontWeight: 700, color: '#aaa', marginLeft: 8, alignSelf: 'flex-end', marginBottom: 8 }}>{t.ampm}</span>}
        </div>
    );
}

// ============================================================================
// CLOCK 7 — MECHANICAL / GEAR aesthetic
// ============================================================================
function GearShape({ r, cx, cy, teeth, rot, color }: { r: number; cx: number; cy: number; teeth: number; rot: number; color: string }) {
    const points: string[] = [];
    for (let i = 0; i < teeth * 2; i++) {
        const angle = (i * Math.PI) / teeth + rot;
        const radius = i % 2 === 0 ? r : r * 0.78;
        points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
    }
    return <polygon points={points.join(' ')} fill={color} stroke="var(--bg)" strokeWidth={1.5} />;
}
function MechanicalClock({ t }: { t: TimeState }) {
    const sRot = (t.s / 60) * 2 * Math.PI;
    const mRot = ((t.m * 60 + t.s) / 3600) * 2 * Math.PI;
    const hRot = (((t.h % 12) * 3600 + t.m * 60) / 43200) * 2 * Math.PI;
    return (
        <div style={{ position: 'relative' }}>
            <svg width={220} height={220} viewBox="0 0 220 220">
                <rect width={220} height={220} rx={12} fill="#1a0f00" />
                {/* Large gear */}
                <g style={{ transformOrigin: '110px 110px', transform: `rotate(${t.s * 6}deg)`, transition: 'transform 0.1s linear' }}>
                    <GearShape r={90} cx={110} cy={110} teeth={24} rot={sRot} color="#5c3a1e" />
                    <circle cx={110} cy={110} r={70} fill="#2a1800" />
                </g>
                {/* Medium gear */}
                <g style={{ transformOrigin: '110px 110px', transform: `rotate(${-t.m * 6}deg)` }}>
                    <GearShape r={55} cx={110} cy={110} teeth={16} rot={mRot} color="#8B6914" />
                    <circle cx={110} cy={110} r={42} fill="#1a0f00" />
                </g>
                {/* Small gear */}
                <g style={{ transformOrigin: '110px 110px', transform: `rotate(${(t.h % 12) * 30}deg)` }}>
                    <GearShape r={30} cx={110} cy={110} teeth={10} rot={hRot} color="#c0a020" />
                    <circle cx={110} cy={110} r={20} fill="#0a0500" />
                </g>
                <circle cx={110} cy={110} r={8} fill="#f0c040" />
                <text x={110} y={190} textAnchor="middle" fontSize={10} fill="#8B6914" fontFamily="Georgia">{`${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`}</text>
            </svg>
        </div>
    );
}

// ============================================================================
// CLOCK 8 — PENDULUM
// ============================================================================
function PendulumClock({ t, fmt }: { t: TimeState; fmt: HourFormat }) {
    const h = fmt === '12' ? t.h12 : t.h;
    const swing = Math.sin((t.s + t.ms / 1000) * Math.PI); // -1 to 1
    const angle = swing * 20;
    return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: 'var(--surface)', border: '2px solid var(--border2)', borderRadius: '12px 12px 4px 4px', overflow: 'hidden', minWidth: 140 }}>
            {/* Clock face */}
            <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid var(--border2)', width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, fontFamily: 'Georgia, serif', color: 'var(--text)', lineHeight: 1 }}>
                    {pad(h)}:{pad(t.m)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                    {fmt === '12' ? t.ampm : ''} {t.s}s
                </div>
            </div>
            {/* Pendulum housing */}
            <div style={{ height: 100, width: '100%', background: 'var(--surface2)', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', top: 0, left: '50%', transformOrigin: '0 0', transform: `translateX(-1px) rotate(${angle}deg)`, transition: 'transform 0.05s linear', width: 2, height: 65, background: 'var(--text-dim)' }}>
                    <div style={{ position: 'absolute', bottom: -16, left: -14, width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', border: '3px solid var(--border2)' }} />
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// CLOCK 9 — QUARTZ (sleek minimal)
// ============================================================================
function QuartzClock({ t, fmt }: { t: TimeState; fmt: HourFormat }) {
    const h = fmt === '12' ? t.h12 : t.h;
    return (
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', borderRadius: 20, padding: '24px 32px', display: 'inline-block', boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 'clamp(36px, 7vw, 60px)', fontWeight: 100, letterSpacing: 8, color: '#e2e8f0', fontFamily: '"Helvetica Neue", sans-serif', lineHeight: 1 }}>
                {pad(h)}<span style={{ opacity: 0.5, animation: 'pulse 1s ease-in-out infinite' }}>:</span>{pad(t.m)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', letterSpacing: 3, textTransform: 'uppercase' }}>{t.dayStr}</span>
                {fmt === '12' ? <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{t.ampm}</span> :
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{pad(t.s)}s</span>}
            </div>
            <div style={{ marginTop: 6, height: 2, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', opacity: 0.5 }} />
            <div style={{ marginTop: 6, fontSize: 11, color: '#475569', textAlign: 'center' }}>{t.dateStr}</div>
        </div>
    );
}

// ============================================================================
// CLOCK 10 — RADIO DISPLAY (ham/military)
// ============================================================================
function RadioClock({ t, fmt }: { t: TimeState; fmt: HourFormat }) {
    const h = fmt === '24' ? t.h : t.h12;
    return (
        <div style={{ background: '#080808', border: '2px solid #1a3a1a', borderRadius: 8, padding: '16px 20px', fontFamily: '"Courier New", monospace', display: 'inline-block' }}>
            <div style={{ fontSize: 10, color: '#1a6a1a', letterSpacing: 3, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>◉ LIVE</span><span>FREQ: 77.5kHz</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 12 }}>
                {[['HR', pad(h)], ['MIN', pad(t.m)], ['SEC', pad(t.s)]].map(([l, v]) => (
                    <div key={l} style={{ background: '#0f1a0f', border: '1px solid #1a4a1a', borderRadius: 4, padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#22ff22', textShadow: '0 0 10px #00ff00' }}>{v}</div>
                        <div style={{ fontSize: 8, color: '#1a6a1a', marginTop: 2 }}>{l}</div>
                    </div>
                ))}
            </div>
            <div style={{ fontSize: 9, color: '#1a4a1a', textAlign: 'center', borderTop: '1px solid #1a3a1a', paddingTop: 6 }}>
                {fmt === '12' ? t.ampm + ' · ' : ''}{t.dateStr} · SYNC OK
            </div>
        </div>
    );
}

// ============================================================================
// CLOCK 11 — MULTI-DISPLAY (3 world zones)
// ============================================================================
const ZONES = [
    { label: 'New York', tz: 'America/New_York', flag: '🗽' },
    { label: 'London', tz: 'Europe/London', flag: '🇬🇧' },
    { label: 'Tokyo', tz: 'Asia/Tokyo', flag: '🗼' },
];

function WorldZone({ tz, label, flag, fmt }: { tz: string; label: string; flag: string; fmt: HourFormat }) {
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const opts: Intl.DateTimeFormatOptions = { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: fmt === '12' };
            setTime(new Intl.DateTimeFormat('en-US', opts).format(now));
            setDate(new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'short', day: 'numeric' }).format(now));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [tz, fmt]);
    return (
        <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '14px 16px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 20 }}>{flag}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent)', fontFamily: 'monospace', marginTop: 6, letterSpacing: 1 }}>{time}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{date}</div>
        </div>
    );
}
function MultiDisplayClock({ fmt }: { fmt: HourFormat }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: 4 }}>
            {ZONES.map(z => <WorldZone key={z.tz} {...z} fmt={fmt} />)}
        </div>
    );
}

// ============================================================================
// CLOCK 12 — CUCKOO (animated bird on the hour)
// ============================================================================
function CuckooClock({ t, fmt }: { t: TimeState; fmt: HourFormat }) {
    const h = fmt === '12' ? t.h12 : t.h;
    const isCuckoo = t.m === 0 && t.s < 3;
    return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: 'var(--surface)', border: '2px solid var(--border2)', borderRadius: '16px 16px 8px 8px', padding: '0 0 12px', overflow: 'hidden', minWidth: 160 }}>
            {/* Roof */}
            <div style={{ width: '110%', height: 24, background: 'var(--surface2)', clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)', marginBottom: 0 }} />
            {/* Door with bird */}
            <div style={{ position: 'relative', width: 48, height: 56, marginTop: -8, background: '#5c3a1e', borderRadius: '12px 12px 4px 4px', border: '2px solid #8B6914', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
                <AnimatePresence>
                    {isCuckoo && (
                        <motion.div initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30 }}
                            style={{ position: 'absolute', fontSize: 24, lineHeight: 1, bottom: 4 }}>🐦</motion.div>
                    )}
                </AnimatePresence>
                {!isCuckoo && <div style={{ fontSize: 20, position: 'absolute', bottom: 4 }}>🚪</div>}
            </div>
            {/* Face */}
            <div style={{ marginTop: 8, textAlign: 'center', padding: '0 16px' }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--text)', fontFamily: 'Georgia, serif', letterSpacing: 2 }}>
                    {pad(h)}:{pad(t.m)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                    {isCuckoo ? '🔔 CUCKOO! '.repeat(Math.min(h, 4)) : t.dayStr}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN GALLERY COMPONENT
// ============================================================================
const CLOCKS = [
    { id: 'digital', label: 'Digital LED', icon: '📟', desc: '7-segment display' },
    { id: 'atomic', label: 'Atomic', icon: '⚛️', desc: 'Millisecond precision' },
    { id: 'analog', label: 'Analog', icon: '🕐', desc: 'Classic watch face' },
    { id: 'roman', label: 'Roman Numeral', icon: '🏛️', desc: 'Latin numerals face' },
    { id: 'word', label: 'Word Clock', icon: '💬', desc: 'Time in English words' },
    { id: 'flip', label: 'Flip / Electric', icon: '📺', desc: 'Retro flip display' },
    { id: 'mechanical', label: 'Mechanical', icon: '⚙️', desc: 'Spinning gear aesthetic' },
    { id: 'pendulum', label: 'Pendulum', icon: '🕰️', desc: 'Swinging grandfather' },
    { id: 'quartz', label: 'Quartz', icon: '💎', desc: 'Sleek modern display' },
    { id: 'radio', label: 'Radio / Military', icon: '📡', desc: 'Ham radio style' },
    { id: 'multi', label: 'World Clocks', icon: '🌐', desc: '3 time zones live' },
    { id: 'cuckoo', label: 'Cuckoo', icon: '🐦', desc: 'On-hour bird animation' },
];

function ClockRenderer({ id, t, fmt }: { id: string; t: TimeState; fmt: HourFormat }) {
    switch (id) {
        case 'digital': return <DigitalClock t={t} fmt={fmt} />;
        case 'atomic': return <AtomicClock t={t} fmt={fmt} />;
        case 'analog': return <AnalogClock t={t} />;
        case 'roman': return <RomanClock t={t} />;
        case 'word': return <WordClock t={t} />;
        case 'flip': return <FlipClock t={t} fmt={fmt} />;
        case 'mechanical': return <MechanicalClock t={t} />;
        case 'pendulum': return <PendulumClock t={t} fmt={fmt} />;
        case 'quartz': return <QuartzClock t={t} fmt={fmt} />;
        case 'radio': return <RadioClock t={t} fmt={fmt} />;
        case 'multi': return <MultiDisplayClock fmt={fmt} />;
        case 'cuckoo': return <CuckooClock t={t} fmt={fmt} />;
        default: return <DigitalClock t={t} fmt={fmt} />;
    }
}

export { ClockRenderer };

export default function ClockGallery() {
    const t = useTime();
    const { homeClockType, setHomeClockType, hourFormat } = useSettings();
    const [size, setSize] = useState<ClockSize>('md');
    const [fmt, setFmt] = useState<HourFormat>(hourFormat as HourFormat);
    const [addedFlash, setAddedFlash] = useState<string | null>(null);
    const scale = SIZE_MAP[size].scale;

    const handleAddToHome = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setHomeClockType(id);
        setAddedFlash(id);
        setTimeout(() => setAddedFlash(null), 2000);
    }, [setHomeClockType]);

    const handleRemoveFromHome = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setHomeClockType('default');
    }, [setHomeClockType]);

    return (
        <div className="min-h-screen px-4 sm:px-8 py-8">
            {/* Header controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>🕐 Clock Gallery</h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>12 designs · tap &quot;Add to Home&quot; to set as your main clock</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface2)' }}>
                        {(['12', '24'] as const).map(f => (
                            <button key={f} onClick={() => setFmt(f)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold themed-transition"
                                style={fmt === f ? { background: 'var(--accent)', color: '#000' } : { color: 'var(--text-dim)' }}>
                                {f}hr
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface2)' }}>
                        {(Object.entries(SIZE_MAP) as [ClockSize, { scale: number; label: string }][]).map(([k, v]) => (
                            <button key={k} onClick={() => setSize(k)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold themed-transition"
                                style={size === k ? { background: 'var(--accent)', color: '#000' } : { color: 'var(--text-dim)' }}>
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Currently pinned notice */}
            {homeClockType !== 'default' && (
                <motion.div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: 'rgba(var(--accent-rgb,255,87,34),0.08)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <span>📌</span>
                    <span className="text-sm font-semibold">
                        {CLOCKS.find(c => c.id === homeClockType)?.label} is set as your Home clock
                    </span>
                    <button onClick={handleRemoveFromHome}
                        className="ml-auto text-xs px-3 py-1 rounded-lg themed-transition"
                        style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                        ✕ Remove
                    </button>
                </motion.div>
            )}

            {/* Grid */}
            <motion.div
                className="grid gap-4"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}
                initial="hidden" animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
                {CLOCKS.map(clock => {
                    const isHome = homeClockType === clock.id;
                    const justAdded = addedFlash === clock.id;
                    return (
                        <motion.div key={clock.id}
                            className="p-5 rounded-3xl flex flex-col gap-3"
                            style={{
                                background: isHome ? 'var(--surface)' : 'var(--surface)',
                                border: isHome ? '2px solid var(--accent)' : '1px solid var(--border)',
                                position: 'relative',
                            }}
                            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                            whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}>

                            {/* Pinned badge */}
                            {isHome && (
                                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                    style={{ background: 'var(--accent)', color: '#000' }}>📌 HOME</div>
                            )}

                            {/* Clock info */}
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{clock.icon}</span>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{clock.label}</p>
                                    <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{clock.desc}</p>
                                </div>
                            </div>

                            {/* Live preview */}
                            <div className="flex items-center justify-center overflow-hidden rounded-2xl py-3"
                                style={{ background: 'var(--surface2)', minHeight: 100 }}>
                                <div style={{ transform: `scale(${scale * 0.6})`, transformOrigin: 'center center', pointerEvents: 'none' }}>
                                    <ClockRenderer id={clock.id} t={t} fmt={fmt} />
                                </div>
                            </div>

                            {/* Add to Home button */}
                            <AnimatePresence mode="wait">
                                {justAdded ? (
                                    <motion.div key="flash" className="py-2 rounded-xl text-xs font-bold text-center"
                                        style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                                        ✓ Set as Home Clock!
                                    </motion.div>
                                ) : isHome ? (
                                    <motion.button key="remove"
                                        onClick={handleRemoveFromHome}
                                        className="py-2 rounded-xl text-xs font-bold themed-transition w-full"
                                        style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        ✕ Remove from Home
                                    </motion.button>
                                ) : (
                                    <motion.button key="add"
                                        onClick={(e) => handleAddToHome(clock.id, e)}
                                        className="py-2 rounded-xl text-xs font-bold themed-transition w-full"
                                        style={{ background: 'var(--surface2)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        whileTap={{ scale: 0.97 }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.color = '#000'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}>
                                        🏠 Add to Home
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}
