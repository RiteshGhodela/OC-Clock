'use client';

import { useState, useRef, useEffect } from 'react';
import type { DayData } from '@/hooks/useCalendarStore';

interface Props {
    dateKey: string;
    dayData: DayData;
    onClose: () => void;
    onToggleTick: () => void;
    onAddNote: (text: string) => void;
    onRemoveNote: (id: string) => void;
}

export default function DayModal({ dateKey, dayData, onClose, onToggleTick, onAddNote, onRemoveNote }: Props) {
    const [noteText, setNoteText] = useState('');
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
