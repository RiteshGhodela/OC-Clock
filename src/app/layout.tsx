import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { SettingsProvider } from '@/context/SettingsContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
    title: 'Horloge — Clock, Calendar & Diary',
    description: 'A premium productivity suite with clock themes, timer, stopwatch, calendar, diary, calculators, converters, and invoice generator.',
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="themed-bg themed-text themed-transition min-h-screen">
                <ThemeProvider>
                    <SettingsProvider>
                        <AppShell>{children}</AppShell>
                    </SettingsProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
