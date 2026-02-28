'use client';

import { useState, useRef, useEffect } from 'react';
import type { DiaryEntry } from '@/hooks/useDiaryStore';

interface Props {
    entry: DiaryEntry | null;  // null = new entry
    onSave: (data: { title: string; body: string }) => void;
    onDelete?: () => void;
    onClose: () => void;
}

export default function DiaryEditor({ entry, onSave, onDelete, onClose }: Props) {
    const [title, setTitle] = useState(entry?.title ?? '');
    const [body, setBody] = useState(entry?.body ?? '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        titleRef.current?.focus();
    }, []);

    const handleSave = () => {
        if (!title.trim() && !body.trim()) return;
        onSave({ title: title.trim() || 'Untitled', body });
    };

    const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <div className="modal-enter w-full max-w-2xl mx-4 rounded-[2rem] flex flex-col"
                style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border2)',
                    maxHeight: '90vh',
                }}>
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                        <span className="text-lg">📝</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-dim)' }}>
                            {entry ? 'Edit Entry' : 'New Entry'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
                            {wordCount} word{wordCount !== 1 ? 's' : ''}
                        </span>
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                            style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 px-6 py-4 gap-4 overflow-y-auto">
                    {/* Title */}
                    <input
                        ref={titleRef}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Entry title…"
                        className="text-2xl font-semibold outline-none bg-transparent w-full"
                        style={{ color: 'var(--text)' }}
                    />

                    {/* Divider */}
                    <div className="h-px" style={{ background: 'var(--border)' }} />

                    {/* Body */}
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder="Write your thoughts here…"
                        className="flex-1 outline-none bg-transparent resize-none text-sm leading-relaxed"
                        style={{ color: 'var(--text)', minHeight: 240 }}
                    />
                </div>

                {/* Bottom actions */}
                <div className="flex items-center justify-between px-6 py-4"
                    style={{ borderTop: '1px solid var(--border)' }}>
                    {/* Delete */}
                    <div>
                        {onDelete && !showDeleteConfirm && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 rounded-xl text-sm themed-transition"
                                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                🗑 Delete
                            </button>
                        )}
                        {showDeleteConfirm && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm" style={{ color: '#ef4444' }}>Are you sure?</span>
                                <button onClick={onDelete}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                                    style={{ background: '#ef4444', color: '#fff' }}>
                                    Delete
                                </button>
                                <button onClick={() => setShowDeleteConfirm(false)}
                                    className="px-3 py-1.5 rounded-xl text-xs"
                                    style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Save + Cancel */}
                    <div className="flex gap-2">
                        <button onClick={onClose}
                            className="px-5 py-2.5 rounded-2xl text-sm"
                            style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                            Cancel
                        </button>
                        <button onClick={handleSave}
                            className="px-6 py-2.5 rounded-2xl text-sm font-semibold themed-transition hover:brightness-110"
                            style={{ background: 'var(--accent)', color: '#000' }}>
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
