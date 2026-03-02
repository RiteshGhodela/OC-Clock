'use client';

import { useState, useRef, useEffect } from 'react';
import type { DayData, CalendarEvent } from '@/hooks/useCalendarStore';
import { isOverlapping, suggestFreeSlot } from '@/lib/conflictResolver';

interface Props {
    dateKey: string;
    dayData: DayData;
    onClose: () => void;
    onToggleTick: () => void;
    onAddNote: (text: string) => void;
    onRemoveNote: (id: string) => void;
    onAddEvent: (ev: Omit<CalendarEvent, 'id'>) => void;
    onRemoveEvent: (id: string) => void;
    onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
}

export default function DayModal({ dateKey, dayData, onClose, onToggleTick, onAddNote, onRemoveNote, onAddEvent, onRemoveEvent, onUpdateEvent }: Props) {
    const [noteText, setNoteText] = useState('');
    const [eventTitle, setEventTitle] = useState('');
    const [eventStart, setEventStart] = useState('09:00');
    const [eventEnd, setEventEnd] = useState('10:00');
    const [eventPriority, setEventPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [conflict, setConflict] = useState<{ newEvent: Omit<CalendarEvent, 'id'>; overlaps: CalendarEvent[]; suggestedSlot: { startTime: string, endTime: string } | null } | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (overlayRef.current && e.target === overlayRef.current) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    const handleAddNote = () => {
        const trimmed = noteText.trim();
        if (!trimmed) return;
        onAddNote(trimmed);
        setNoteText('');
    };

    const handleAddEvent = () => {
        const trimmedTitle = eventTitle.trim() || 'Untitled Event';
        const newEvent = { title: trimmedTitle, startTime: eventStart, endTime: eventEnd, priority: eventPriority };

        // Ensure end time is strictly after start time logically
        let [sh, sm] = eventStart.split(':').map(Number);
        let [eh, em] = eventEnd.split(':').map(Number);
        const duration = (eh * 60 + em) - (sh * 60 + sm);
        if (duration <= 0) return; // invalid time

        const overlaps = isOverlapping(newEvent, dayData.events || []);
        if (overlaps.length > 0) {
            const suggestedSlot = suggestFreeSlot(duration, dayData.events || []);
            setConflict({ newEvent, overlaps, suggestedSlot });
            return;
        }

        onAddEvent(newEvent);
        resetEventForm();
    };

    const resetEventForm = () => {
        setEventTitle(''); setEventStart('09:00'); setEventEnd('10:00'); setEventPriority('Medium');
        setConflict(null);
    };

    const confirmConflict = (useSuggested: boolean) => {
        if (!conflict) return;
        if (useSuggested && conflict.suggestedSlot) {
            onAddEvent({ ...conflict.newEvent, ...conflict.suggestedSlot });
        } else {
            onAddEvent(conflict.newEvent);
        }
        resetEventForm();
    };

    const [y, m, d] = dateKey.split('-').map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    });

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-enter w-full max-w-md mx-4 rounded-3xl p-6 flex flex-col gap-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border2)' }}>
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{label}</h3>
                        <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-dim)' }}>{dateKey}</p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
                        ✕
                    </button>
                </div>

                {/* Tick toggle */}
                <button
                    onClick={onToggleTick}
                    className="flex items-center gap-3 p-4 rounded-2xl themed-transition text-left"
                    style={{
                        background: dayData.ticked ? 'var(--accent)' : 'var(--surface2)',
                        color: dayData.ticked ? '#000' : 'var(--text-dim)',
                        border: `1px solid ${dayData.ticked ? 'transparent' : 'var(--border2)'}`,
                    }}>
                    <span className="text-2xl">{dayData.ticked ? '✅' : '☐'}</span>
                    <div>
                        <p className="font-semibold text-sm">{dayData.ticked ? 'Ticked!' : 'Mark as Done'}</p>
                        <p className="text-xs opacity-70">Tap to {dayData.ticked ? 'un-tick' : 'tick'} this day</p>
                    </div>
                </button>

                {/* Events */}
                <div className="flex flex-col gap-2 relative">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-dim)' }}>
                        Events ({(dayData.events || []).length})
                    </p>

                    {/* Add Event Form */}
                    <div className="flex flex-col gap-2 p-3 rounded-xl text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface2)' }}>
                        <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Event Title" className="w-full bg-transparent outline-none" style={{ color: 'var(--text)' }} />
                        <div className="flex gap-2 items-center">
                            <input type="time" value={eventStart} onChange={e => setEventStart(e.target.value)} className="bg-transparent outline-none flex-1" style={{ color: 'var(--text)', appearance: 'none', WebkitAppearance: 'none' }} />
                            <span style={{ color: 'var(--text-dim)' }}>-</span>
                            <input type="time" value={eventEnd} onChange={e => setEventEnd(e.target.value)} className="bg-transparent outline-none flex-1" style={{ color: 'var(--text)', appearance: 'none', WebkitAppearance: 'none' }} />
                            <select value={eventPriority} onChange={e => setEventPriority(e.target.value as any)} className="bg-transparent outline-none" style={{ color: 'var(--text)' }}>
                                <option value="Low" className="text-black">Low</option>
                                <option value="Medium" className="text-black">Med</option>
                                <option value="High" className="text-black">High</option>
                            </select>
                            <button onClick={handleAddEvent} className="px-3 py-1.5 rounded-lg font-semibold themed-transition flex-shrink-0" style={{ background: 'var(--accent)', color: '#000' }}>
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Conflict Dialog */}
                    {conflict && (
                        <div className="p-3 rounded-xl flex flex-col gap-2 mt-1" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <p className="text-sm text-red-500 font-semibold flex items-center gap-1">⚠️ Conflict Detected</p>
                            <p className="text-xs text-red-400">Overlaps with: {conflict.overlaps.map(o => o.title).join(', ')}</p>
                            {conflict.suggestedSlot ? (
                                <>
                                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text)' }}>
                                        Shall I move it to <strong style={{ color: 'var(--accent)' }}>{conflict.suggestedSlot.startTime} - {conflict.suggestedSlot.endTime}</strong> where you are free?
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => confirmConflict(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white">Yes, use suggested slot</button>
                                        <button onClick={() => confirmConflict(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>No, keep original time</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>No suitable free slots found during working hours.</p>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => confirmConflict(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white">Add anyway</button>
                                        <button onClick={resetEventForm} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>Cancel</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Events List */}
                    {(dayData.events || []).length > 0 && (
                        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto mt-2">
                            {[...(dayData.events || [])].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(ev => (
                                <div key={ev.id} className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold" style={{ color: 'var(--text)' }}>{ev.title}</p>
                                            <span className="text-[10px] uppercase font-bold px-1 rounded-sm" style={{ background: ev.priority === 'High' ? 'rgba(239, 68, 68, 0.2)' : 'var(--surface)', border: '1px solid var(--border2)', color: ev.priority === 'High' ? '#ef4444' : 'var(--text-dim)' }}>
                                                {ev.priority || 'Medium'}
                                            </span>
                                        </div>
                                        <p className="text-xs opacity-70 mt-0.5" style={{ color: 'var(--text)' }}>{ev.startTime} - {ev.endTime}</p>
                                    </div>
                                    <button onClick={() => onRemoveEvent(ev.id)} className="text-xs opacity-40 hover:opacity-80 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-dim)' }}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-dim)' }}>
                        Notes ({dayData.notes.length})
                    </p>

                    {/* Add note */}
                    <div className="flex gap-2">
                        <input
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                            placeholder="Add a note…"
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                            style={{
                                background: 'var(--surface2)',
                                color: 'var(--text)',
                                border: '1px solid var(--border2)',
                            }}
                        />
                        <button onClick={handleAddNote}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold themed-transition"
                            style={{ background: 'var(--accent)', color: '#000' }}>
                            +
                        </button>
                    </div>

                    {/* Note list */}
                    {dayData.notes.length > 0 && (
                        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                            {dayData.notes.map(note => (
                                <div key={note.id}
                                    className="flex items-start gap-2 p-3 rounded-xl text-sm"
                                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                                    <p className="flex-1" style={{ color: 'var(--text)' }}>{note.text}</p>
                                    <button onClick={() => onRemoveNote(note.id)}
                                        className="text-xs opacity-40 hover:opacity-80 mt-0.5 flex-shrink-0"
                                        style={{ color: 'var(--text-dim)' }}>
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
