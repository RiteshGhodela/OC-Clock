import { CalendarEvent } from '@/hooks/useCalendarStore';

export function isOverlapping(newEv: CalendarEvent | Omit<CalendarEvent, 'id'>, existingEvs: CalendarEvent[]): CalendarEvent[] {
    const parseTime = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const newStart = parseTime(newEv.startTime);
    const newEnd = parseTime(newEv.endTime);

    return existingEvs.filter(ev => {
        if ('id' in newEv && ev.id === newEv.id) return false;

        const start = parseTime(ev.startTime);
        const end = parseTime(ev.endTime);
        return Math.max(newStart, start) < Math.min(newEnd, end);
    });
}

export function suggestFreeSlot(
    durationMinutes: number,
    existingEvs: CalendarEvent[],
    workingHoursStart: string = '09:00',
    workingHoursEnd: string = '18:00'
): { startTime: string, endTime: string } | null {
    const parseTime = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const startMin = parseTime(workingHoursStart);
    const endMin = parseTime(workingHoursEnd);

    // Create busy blocks
    const busy = existingEvs.map(ev => ({
        s: parseTime(ev.startTime),
        e: parseTime(ev.endTime)
    })).sort((a, b) => a.s - b.s);

    let current = startMin;
    for (const b of busy) {
        if (b.s - current >= durationMinutes) {
            return {
                startTime: formatTime(current),
                endTime: formatTime(current + durationMinutes)
            };
        }
        current = Math.max(current, b.e);
    }

    if (endMin - current >= durationMinutes) {
        return {
            startTime: formatTime(current),
            endTime: formatTime(current + durationMinutes)
        };
    }

    return null;
}
