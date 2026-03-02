'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, THEMES } from '@/context/ThemeContext';
import MorningBriefingListener from './MorningBriefingListener';
import clsx from 'clsx';
import { Menu, X } from 'lucide-react';

const navItems = [
    { href: '/', icon: '🕐', label: 'Clock' },
    { href: '/calendar', icon: '📅', label: 'Calendar' },
    { href: '/diary', icon: '📓', label: 'Diary' },
    { href: '/calculators', icon: '🧮', label: 'Calculators' },
    { href: '/tools', icon: '🔧', label: 'Tools' },
    { href: '/invoice', icon: '🧾', label: 'Invoice' },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [themeOpen, setThemeOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // ── Scroll-hide / reveal header ──────────────────────────────────────────
    const [headerVisible, setHeaderVisible] = useState(false);   // hidden on load
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
        const onScroll = () => {
            if (ticking.current) return;
            ticking.current = true;
            requestAnimationFrame(() => {
                const y = window.scrollY;
                const delta = y - lastScrollY.current;
                if (y < 8) {
                    // At very top — keep hidden (initial state)
                    setHeaderVisible(false);
                } else if (delta > 0) {
                    // Scrolling DOWN — hide
                    setHeaderVisible(false);
                } else if (delta < -4) {
                    // Scrolling UP — reveal
                    setHeaderVisible(true);
                }
                lastScrollY.current = y;
                ticking.current = false;
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const currentPage = navItems.find(n =>
        n.href === '/' ? pathname === '/' : pathname.startsWith(n.href)
    );

    // Split themes into dark/light groups for display
    const darkThemes = THEMES.filter(t => t.isDark);
    const lightThemes = THEMES.filter(t => !t.isDark);

    return (
        <div className="flex min-h-screen themed-bg">

            {/* ── Mobile Sidebar Overlay Backdrop ──────────────────────────── */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* ── Sidebar (always visible on md+, toggleable on mobile) ────── */}
            <aside
                className={clsx(
                    "fixed top-0 h-full z-50 flex flex-col items-center py-5 gap-2 themed-transition glass-panel glass-rim md:left-0",
                    sidebarOpen ? "left-0" : "-left-full"
                )}
                style={{ width: 72 }}>

                {/* Logo */}
                <Link href="/"
                    className="mb-5 flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black select-none themed-transition"
                    style={{ background: 'var(--accent)', color: 'var(--bg)', boxShadow: '0 2px 12px var(--accent-glow)' }}>
                    OC
                </Link>

                {/* Nav items — animate in on load */}
                <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2">
                    {navItems.map((item, i) => {
                        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                        return (
                            <motion.div key={item.href} className="w-full"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 + i * 0.07, type: 'spring', stiffness: 280, damping: 24 }}>
                                <Link href={item.href} title={item.label}
                                    className="relative flex flex-col items-center justify-center w-full h-12 rounded-2xl text-xl themed-transition group"
                                    style={active
                                        ? { background: 'var(--accent)', color: 'var(--bg)', boxShadow: '0 4px 12px var(--accent-glow)' }
                                        : { color: 'var(--text-dim)' }}>
                                    <span>{item.icon}</span>
                                    {/* Tooltip */}
                                    <span className="absolute left-[60px] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 themed-transition glass-panel glass-rim"
                                        style={{ color: 'var(--text)' }}>
                                        {item.label}
                                    </span>
                                </Link>
                            </motion.div>
                        );
                    })}
                </nav>

                {/* Theme swatch — animate in from bottom */}
                <motion.div className="mt-auto flex flex-col items-center gap-2 w-full px-2 pt-3"
                    style={{ borderTop: '1px solid var(--border)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 24 }}>
                    <button
                        onClick={() => setThemeOpen(o => !o)}
                        title="Change theme"
                        className="w-full h-10 rounded-2xl flex items-center justify-center text-lg themed-transition"
                        style={{ background: 'var(--surface2)', boxShadow: `0 0 0 2px var(--accent)` }}>
                        🎨
                    </button>
                </motion.div>
            </aside>

            {/* ── Theme picker flyout ─────────────────────────────────────── */}
            <AnimatePresence>
                {themeOpen && (
                    <>
                        <motion.div className="fixed inset-0 z-30"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setThemeOpen(false)} />
                        <motion.div
                            className="fixed z-50 rounded-3xl p-4 flex flex-col gap-3 glass-panel glass-rim"
                            style={{ left: 82, bottom: 16, width: 240 }}
                            initial={{ opacity: 0, x: -16, scale: 0.96 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -16, scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 28 }}>

                            <p className="text-xs font-semibold uppercase tracking-widest"
                                style={{ color: 'var(--text-dim)' }}>🌙 Dark</p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {darkThemes.map(t => (
                                    <button key={t.value}
                                        onClick={() => { setTheme(t.value); setThemeOpen(false); }}
                                        className="flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-medium themed-transition text-left"
                                        style={{
                                            background: theme === t.value ? 'var(--surface2)' : 'transparent',
                                            border: `1px solid ${theme === t.value ? t.accent : 'var(--border)'}`,
                                            color: 'var(--text)',
                                            boxShadow: theme === t.value ? `0 0 0 1.5px ${t.accent}30` : 'none',
                                        }}>
                                        <span className="w-4 h-4 rounded-full flex-shrink-0 inline-block"
                                            style={{ background: t.accent }} />
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            <p className="text-xs font-semibold uppercase tracking-widest mt-1"
                                style={{ color: 'var(--text-dim)' }}>☀ Light</p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {lightThemes.map(t => (
                                    <button key={t.value}
                                        onClick={() => { setTheme(t.value); setThemeOpen(false); }}
                                        className="flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-medium themed-transition text-left"
                                        style={{
                                            background: theme === t.value ? 'var(--surface2)' : 'transparent',
                                            border: `1px solid ${theme === t.value ? t.accent : 'var(--border)'}`,
                                            color: 'var(--text)',
                                            boxShadow: theme === t.value ? `0 0 0 1.5px ${t.accent}30` : 'none',
                                        }}>
                                        <span className="w-4 h-4 rounded-full flex-shrink-0 inline-block border"
                                            style={{ background: t.accent, borderColor: 'var(--border)' }} />
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Main content area ───────────────────────────────────────── */}
            <div className="flex-1 flex flex-col md:ml-[72px] ml-0 w-full transition-all duration-300">

                {/* ── Top bar: slides UP on load / scrolling down,
                              slides DOWN to reveal on scroll up ──────────── */}
                <motion.div
                    className="sticky top-0 z-30 flex items-center px-4 sm:px-8 py-3 themed-transition glass-panel glass-rim"
                    animate={{
                        y: headerVisible ? 0 : -64,
                        opacity: headerVisible ? 1 : 0,
                    }}
                    initial={{ y: -64, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 36 }}>
                    <div className="flex items-center gap-3">
                        {/* Removed Top Mobile Menu Button */}
                        <span className="text-base">{currentPage?.icon}</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                            {currentPage?.label ?? 'Horloge'}
                        </span>
                    </div>
                    <div className="flex-1" />
                    {/* Active theme pill */}
                    <button
                        onClick={() => setThemeOpen(o => !o)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium themed-transition hover:opacity-80 glass-panel"
                        style={{ color: 'var(--text-dim)' }}>
                        <span className="w-3 h-3 rounded-full inline-block"
                            style={{ background: THEMES.find(t => t.value === theme)?.accent }} />
                        {THEMES.find(t => t.value === theme)?.label}
                    </button>
                </motion.div>

                {/* Page content */}
                <AnimatePresence mode="wait">
                    <motion.main
                        key={pathname}
                        className="flex-1 overflow-auto"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}>
                        {children}
                    </motion.main>
                </AnimatePresence>

                {/* Bottom Center FAB for Mobile Menu */}
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center w-14 h-14 rounded-full shadow-2xl themed-transition"
                    style={{ background: 'var(--accent)', color: '#000', border: '4px solid var(--bg)' }}
                >
                    <Menu size={24} />
                </button>
            </div>
            <MorningBriefingListener />
        </div>
    );
}
