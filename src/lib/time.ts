export function pad(n: number, digits = 2): string {
    return String(n).padStart(digits, '0');
}

export function formatTime(date: Date, tz?: string): string {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: tz,
    });
}

export function formatDate(date: Date, tz?: string): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: tz,
    });
}

export function getTimeParts(date: Date, tz?: string) {
    const str = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: tz,
    });
    const [h, m, s] = str.split(':').map(Number);
    return { hours: h, minutes: m, seconds: s };
}

export function getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function formatCalendarKey(year: number, month: number, day: number): string {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function formatMs(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(centis)}`;
}
