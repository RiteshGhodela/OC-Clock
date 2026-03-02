'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useSettings, clockSizes, ClockSize, ClockPosition, HourFormat } from '@/context/SettingsContext';
import { getUserTimezone } from '@/lib/time';
import NothingClock from './NothingClock';
import Android16Clock from './Android16Clock';
import BWClock from './BWClock';
import Timer from './Timer';
import Stopwatch from './Stopwatch';
import ClockGallery from './ClockGallery';
import AlarmClock from './AlarmClock';
import clsx from 'clsx';

type Tab = 'clock' | 'alarm' | 'timer' | 'stopwatch' | 'gallery';

const IDLE_OPTION_LABELS: Record<number, string> = {
    30000: '30 sec',
    60000: '1 min',
    180000: '3 min',
    300000: '5 min',
    600000: '10 min',
};

// ── Drag Resize Handle ────────────────────────────────────────────────────────
function DragResizeHandle({ onDrag }: { onDrag: (delta: number) => void }) {
    const startY = useRef<number | null>(null);

    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        startY.current = e.clientY;
        const onMove = (me: MouseEvent) => {
            if (startY.current === null) return;
            onDrag(me.clientY - startY.current);
            startY.current = me.clientY;
        };
        const onUp = () => {
            startY.current = null;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const onTouchStart = (e: React.TouchEvent) => {
        startY.current = e.touches[0].clientY;
        const onMove = (te: TouchEvent) => {
            if (startY.current === null) return;
            onDrag(te.touches[0].clientY - startY.current);
            startY.current = te.touches[0].clientY;
        };
        const onEnd = () => {
            startY.current = null;
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
        };
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd);
    };

    return (
        <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            title="Drag up/down to resize"
            className="flex items-center justify-center gap-1 cursor-ns-resize select-none mt-3 px-4 py-1.5 rounded-full themed-transition hover:brightness-125 active:brightness-150"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text-dim)', width: 'fit-content', margin: '12px auto 0' }}>
            <svg width="18" height="8" viewBox="0 0 18 8" fill="currentColor" opacity={0.6}>
                <rect x="0" y="0" width="18" height="2" rx="1" />
                <rect x="0" y="6" width="18" height="2" rx="1" />
            </svg>
            <span style={{ fontSize: 10 }}>Drag to Resize</span>
        </div>
    );
}

// ── Floating Pin Widget ───────────────────────────────────────────────────────
function FloatingPinWidget({
    ClockFace, timezone, opacity, onClose
}: {
    ClockFace: React.ComponentType<{ timezone: string }>;
    timezone: string;
    opacity: number;
    onClose: () => void;
}) {
    const [pos, setPos] = useState({ x: 20, y: 80 });
    const dragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });

    const onMouseDown = (e: React.MouseEvent) => {
        dragging.current = true;
        offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        const onMove = (me: MouseEvent) => {
            if (!dragging.current) return;
            setPos({ x: me.clientX - offset.current.x, y: me.clientY - offset.current.y });
        };
        const onUp = () => {
            dragging.current = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    return (
        <motion.div
            className="fixed z-[200] rounded-3xl overflow-hidden shadow-2xl"
            // Bug 3 fix: scale must NOT be in style — framer-motion owns it via animate.
            style={{ left: pos.x, top: pos.y, opacity, cursor: 'grab', transformOrigin: 'top left', border: '1px solid var(--border2)' }}
            initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity, scale: 0.55 }}
            exit={{ opacity: 0, scale: 0.4 }}
            onMouseDown={onMouseDown}>
            <div className="relative">
                <button onClick={onClose}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer' }}>✕</button>
                <ClockFace timezone={timezone} />
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ClockPage() {
    const { theme } = useTheme();
    const {
        clockSize, setClockSize,
        clockScale, setClockScale,
        screensaverType, setScreensaverType,
        screensaverIdleMs, setScreensaverIdleMs,
        hourFormat, setHourFormat,
        showSeconds, setShowSeconds,
        showDate, setShowDate,
        clockOpacity, setClockOpacity,
        clockPosition, setClockPosition,
        pinnedClockVisible, setPinnedClockVisible,
    } = useSettings();

    const [tab, setTab] = useState<Tab>('clock');
    const [timezone, setTimezone] = useState('UTC');
    const [fullscreen, setFullscreen] = useState(false);
    const [locLoading, setLocLoading] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [screensaverActive, setScreensaverActive] = useState(false);

    // Combined scale: preset + drag fine-tune
    const baseScale = clockSizes[clockSize];
    const combinedScale = Math.max(0.3, Math.min(3.0, baseScale * clockScale));

    const clockScaleRef = useRef(clockScale);
    clockScaleRef.current = clockScale;

    const handleDrag = useCallback((deltaY: number) => {
        // Drag up = bigger (+), drag down = smaller (-)
        const next = Math.max(0.3, Math.min(4.0, clockScaleRef.current - deltaY * 0.004));
        setClockScale(next);
    }, [setClockScale]);

    const resetScale = () => setClockScale(1.0);

    useEffect(() => {
        setTimezone(getUserTimezone());
        setLocLoading(false);
    }, []);

    // Idle screensaver timer
    useEffect(() => {
        if (screensaverType === 'none') return;
        let timer: ReturnType<typeof setTimeout>;
        const reset = () => {
            clearTimeout(timer);
            setScreensaverActive(false);
            timer = setTimeout(() => setScreensaverActive(true), screensaverIdleMs);
        };
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach(e => window.addEventListener(e, reset, { passive: true }));
        reset();
        return () => {
            clearTimeout(timer);
            events.forEach(e => window.removeEventListener(e, reset));
        };
    }, [screensaverType, screensaverIdleMs]);

    // For NothingClock, we pass hourFormat. Wrap the component so the prop
    // is forwarded while other clocks (which don't accept it) stay unchanged.
    const ClockFace: React.ComponentType<{ timezone: string }> =
        theme === 'nothing'
            ? ({ timezone }: { timezone: string }) => <NothingClock timezone={timezone} hourFormat={hourFormat} />
            : theme === 'android16' ? Android16Clock
                : BWClock;

    const tabs: { id: Tab; label: string }[] = [
        { id: 'clock', label: '🕐 Clock' },
        { id: 'alarm', label: '⏰ Alarm' },
        { id: 'timer', label: '⏱ Timer' },
        { id: 'stopwatch', label: '⏩ Stopwatch' },
        { id: 'gallery', label: '🗂 Gallery' },
    ];

    const clockContent = tab === 'gallery' ? (
        <ClockGallery />
    ) : (
        <div className="flex flex-col items-center w-full mt-4 sm:mt-0">
            <motion.div
                className="flex flex-col items-center w-full"
                animate={{ scale: combinedScale, opacity: clockOpacity }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
                {!locLoading && tab === 'clock' && (
                    <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-xs sm:text-sm"
                        style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                        <span>📍</span>
                        <span className="font-mono text-[10px] sm:text-xs">Auto: {timezone}</span>
                    </div>
                )}
                <div className={clsx('w-full flex justify-center', tab === 'clock' ? '' : 'max-w-lg mx-auto px-4 sm:px-6')}>
                    {tab === 'clock' && !locLoading && <ClockFace timezone={timezone} />}
                    {tab === 'alarm' && <AlarmClock />}
                    {tab === 'timer' && <Timer />}
                    {tab === 'stopwatch' && <Stopwatch />}
                </div>
            </motion.div>
            {/* Drag resize handle — only on clock tab */}
            {tab === 'clock' && (
                <div className="flex flex-col items-center gap-2 mt-3">
                    <DragResizeHandle onDrag={handleDrag} />
                    {clockScale !== 1.0 && (
                        <button onClick={resetScale}
                            className="text-[10px] px-3 py-1 rounded-lg themed-transition"
                            style={{ color: 'var(--accent)', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                            Reset size ({Math.round(combinedScale * 100)}%)
                        </button>
                    )}
                    {/* Size presets */}
                    <div className="flex gap-1 p-1 rounded-xl mt-1" style={{ background: 'var(--surface2)' }}>
                        {(['sm', 'md', 'lg', 'xl'] as ClockSize[]).map(s => (
                            <button key={s} onClick={() => { setClockSize(s); setClockScale(1.0); }}
                                className="px-3 py-1 rounded-lg text-xs font-bold uppercase themed-transition"
                                style={clockSize === s && clockScale === 1.0
                                    ? { background: 'var(--accent)', color: '#000' }
                                    : { color: 'var(--text-dim)' }}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    // ── Advanced Settings Panel ───────────────────────────────────────────────
    const settingsPanel = (
        <AnimatePresence>
            {settingsOpen && (
                <>
                    <motion.div className="fixed inset-0 z-40"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSettingsOpen(false)} />
                    <motion.div
                        className="fixed z-50 right-4 top-16 w-80 rounded-3xl p-5 flex flex-col gap-4 overflow-y-auto"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border2)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', maxHeight: 'calc(100vh - 80px)' }}
                        initial={{ opacity: 0, y: -16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}>

                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>⚙ Clock Settings</h3>

                        {/* ── Time Format ── */}
                        <section className="flex flex-col gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Time Format</p>
                            <div className="flex gap-2">
                                {(['12', '24'] as HourFormat[]).map(f => (
                                    <button key={f} onClick={() => setHourFormat(f)}
                                        className="flex-1 py-2 rounded-xl text-xs font-bold themed-transition"
                                        style={hourFormat === f ? { background: 'var(--accent)', color: '#000' } : { background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                                        {f}h
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                {([['showSeconds', showSeconds, setShowSeconds, 'Seconds'] as const,
                                ['showDate', showDate, setShowDate, 'Date'] as const]).map(([, val, setter, label]) => (
                                    <button key={label} onClick={() => (setter as (v: boolean) => void)(!val)}
                                        className="flex-1 py-2 rounded-xl text-xs font-bold themed-transition"
                                        style={val ? { background: 'var(--accent)', color: '#000' } : { background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                                        {val ? '✓ ' : ''}{label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* ── Opacity ── */}
                        <section className="flex flex-col gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Opacity — {Math.round(clockOpacity * 100)}%</p>
                            <input type="range" min={40} max={100} step={5}
                                value={Math.round(clockOpacity * 100)}
                                onChange={e => setClockOpacity(Number(e.target.value) / 100)}
                                className="w-full accent-current" style={{ accentColor: 'var(--accent)' }} />
                        </section>

                        {/* ── Clock Size ── */}
                        <section className="flex flex-col gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Preset Size</p>
                            <div className="flex gap-1">
                                {(['sm', 'md', 'lg', 'xl'] as ClockSize[]).map(s => (
                                    <button key={s} onClick={() => { setClockSize(s); setClockScale(1.0); }}
                                        className="flex-1 py-2 rounded-xl text-xs font-bold uppercase themed-transition"
                                        style={clockSize === s ? { background: 'var(--accent)', color: '#000' } : { background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* ── Position ── */}
                        <section className="flex flex-col gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Clock Position</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 px-1">
                                {(['center', 'top-left', 'top-right', 'floating'] as ClockPosition[]).map(p => (
                                    <button key={p} onClick={() => setClockPosition(p)}
                                        className="py-2 rounded-xl text-xs font-medium capitalize themed-transition"
                                        style={clockPosition === p ? { background: 'var(--accent)', color: '#000' } : { background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                                        {p === 'top-left' ? '↖ Top Left' : p === 'top-right' ? '↗ Top Right' : p === 'floating' ? '📌 Floating' : '⊙ Center'}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* ── Pin Widget / Desktop Mode ── */}
                        <section className="flex flex-col gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Pin / Desktop Mode</p>
                            <button onClick={() => setPinnedClockVisible(!pinnedClockVisible)}
                                className="py-2.5 rounded-2xl text-xs font-bold themed-transition"
                                style={pinnedClockVisible
                                    ? { background: 'var(--accent)', color: '#000' }
                                    : { background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                                {pinnedClockVisible ? '📌 Pinned — click to unpin' : '📌 Pin Clock Widget'}
                            </button>
                            <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Float a draggable mini-clock over any page</p>
                        </section>

                        {/* ── Screensaver ── */}
                        <section className="flex flex-col gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Screensaver</p>
                            <div className="grid grid-cols-2 gap-1">
                                {(['clock', 'stopwatch', 'timer', 'none'] as const).map(s => (
                                    <button key={s} onClick={() => setScreensaverType(s)}
                                        className="py-2 rounded-xl text-xs font-medium capitalize themed-transition"
                                        style={screensaverType === s ? { background: 'var(--accent)', color: '#000' } : { background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                            {screensaverType !== 'none' && (
                                <>
                                    <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Idle trigger time</p>
                                    <div className="grid grid-cols-3 gap-1">
                                        {Object.entries(IDLE_OPTION_LABELS).map(([ms, label]) => (
                                            <button key={ms} onClick={() => setScreensaverIdleMs(Number(ms))}
                                                className="py-2 rounded-xl text-xs font-medium themed-transition"
                                                style={screensaverIdleMs === Number(ms) ? { background: 'var(--accent)', color: '#000' } : { background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </section>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    // ── Screensaver overlay ───────────────────────────────────────────────────
    if (screensaverActive) {
        return (
            <motion.div
                className="fixed inset-0 z-[100] flex items-center justify-center cursor-none"
                style={{ background: 'var(--bg)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => setScreensaverActive(false)}
                onKeyDown={() => setScreensaverActive(false)}>
                <motion.div
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}>
                    {screensaverType === 'clock' && !locLoading && <ClockFace timezone={timezone} />}
                    {screensaverType === 'stopwatch' && <Stopwatch />}
                    {screensaverType === 'timer' && <Timer />}
                </motion.div>
                <p className="absolute bottom-8 text-xs font-mono opacity-30" style={{ color: 'var(--text-dim)' }}>
                    tap to exit screensaver
                </p>
            </motion.div>
        );
    }

    // ── Floating Pin Widget (always rendered when pinned) ────────────────────
    const floatingWidget = pinnedClockVisible && !locLoading ? (
        <AnimatePresence>
            <FloatingPinWidget
                ClockFace={ClockFace}
                timezone={timezone}
                opacity={clockOpacity}
                onClose={() => setPinnedClockVisible(false)}
            />
        </AnimatePresence>
    ) : null;

    // ── Fullscreen mode ───────────────────────────────────────────────────────
    if (fullscreen) {
        return (
            <>
                {floatingWidget}
                <div className="fullscreen-overlay themed-bg themed-transition flex-col gap-6" style={{ background: 'var(--bg)' }}>
                    <div className="theme-bg-deco" />
                    <div className="relative z-10 flex flex-col items-center w-full px-8 gap-6">
                        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface2)' }}>
                            {tabs.map(t => (
                                <button key={t.id} onClick={() => setTab(t.id)}
                                    className={clsx('px-4 py-2 rounded-xl text-sm font-medium themed-transition', tab !== t.id && 'opacity-50 hover:opacity-80')}
                                    style={tab === t.id ? { background: 'var(--accent)', color: '#000' } : { color: 'var(--text-dim)' }}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        {clockContent}
                    </div>
                    <div className="relative z-10 flex gap-3">
                        <button onClick={() => setSettingsOpen(o => !o)}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-base themed-transition"
                            style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>⚙</button>
                        <button onClick={() => setFullscreen(false)}
                            className="w-10 h-10 rounded-full flex items-center justify-center themed-transition"
                            style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>✕</button>
                    </div>
                    {settingsPanel}
                </div>
            </>
        );
    }

    // ── Layout helper for clock position ─────────────────────────────────────
    const positionClass =
        clockPosition === 'top-left' ? 'items-start pt-6' :
            clockPosition === 'top-right' ? 'items-end pt-6' :
                'items-center';

    return (
        <>
            {floatingWidget}
            <div className={clsx('min-h-screen flex flex-col px-4 sm:px-8 py-10 relative', positionClass)}>
                <div className="theme-bg-deco" />
                <div className="relative z-10 w-full max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                            {tab === 'clock' ? '🕐 Clock' : tab === 'timer' ? '⏱ Timer' : tab === 'alarm' ? '⏰ Alarm' : tab === 'gallery' ? '🗂 Gallery' : '⏩ Stopwatch'}
                        </h1>
                        <div className="flex gap-2">
                            <button onClick={() => setSettingsOpen(o => !o)}
                                className="px-3 py-2 rounded-xl text-xs font-medium themed-transition"
                                style={{ background: settingsOpen ? 'var(--accent)' : 'var(--surface2)', color: settingsOpen ? '#000' : 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                                ⚙ Settings
                            </button>
                            <button onClick={() => setFullscreen(true)}
                                className="px-4 py-2 rounded-xl text-xs font-medium themed-transition"
                                style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                                ⛶ Full Screen
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-8 p-1 rounded-2xl" style={{ background: 'var(--surface2)' }}>
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={clsx('flex-1 py-2.5 rounded-xl text-sm font-medium themed-transition', tab !== t.id && 'opacity-50 hover:opacity-80')}
                                style={tab === t.id ? { background: 'var(--accent)', color: '#000' } : { color: 'var(--text-dim)' }}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {clockContent}
                </div>
                {settingsPanel}
            </div>
        </>
    );
}
