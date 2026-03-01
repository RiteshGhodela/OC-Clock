'use client';

import { useState } from 'react';
import { useDiaryStore, DiaryEntry } from '@/hooks/useDiaryStore';
import DiaryEditor from './DiaryEditor';

export default function DiaryPage() {
    const { entries, save, remove } = useDiaryStore();
    const [editingEntry, setEditingEntry] = useState<DiaryEntry | null | undefined>(undefined);
    // undefined = closed, null = new entry, DiaryEntry = editing existing

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
        });

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const snippet = (body: string, max = 100) =>
        body.length > max ? body.slice(0, max) + '…' : body;

    return (
        <div className="min-h-screen px-4 sm:px-8 py-10 w-full overflow-hidden">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 w-full">
                    <div>
                        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>📓 Diary</h1>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                        </p>
                    </div>
                    <button
                        onClick={() => setEditingEntry(null)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold themed-transition hover:brightness-110 shrink-0 w-full sm:w-auto"
                        style={{ background: 'var(--accent)', color: '#000' }}>
                        + New Entry
                    </button>
                </div>

                {/* Empty state */}
                {entries.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                        <div className="text-6xl">📖</div>
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>No entries yet</h2>
                        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                            Start writing your first diary entry.
                        </p>
                        <button
                            onClick={() => setEditingEntry(null)}
                            className="px-6 py-3 rounded-2xl font-semibold text-sm themed-transition hover:brightness-110"
                            style={{ background: 'var(--accent)', color: '#000' }}>
                            Write Entry
                        </button>
                    </div>
                )}

                {/* Entry grid */}
                {entries.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {entries.map(entry => (
                            <button
                                key={entry.id}
                                onClick={() => setEditingEntry(entry)}
                                className="p-5 rounded-3xl text-left themed-transition hover:brightness-110 group"
                                style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                }}>
                                {/* Date badge */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-mono px-2.5 py-1 rounded-full"
                                        style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
                                        {formatDate(entry.createdAt)}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                                        {formatTime(entry.updatedAt)}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="font-semibold text-base mb-1.5 leading-snug"
                                    style={{ color: 'var(--text)' }}>
                                    {entry.title || 'Untitled'}
                                </h3>

                                {/* Body snippet */}
                                <p className="text-sm leading-relaxed"
                                    style={{ color: 'var(--text-dim)' }}>
                                    {snippet(entry.body) || <span className="italic opacity-50">No content</span>}
                                </p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Editor modal */}
                {editingEntry !== undefined && (
                    <DiaryEditor
                        entry={editingEntry}
                        onSave={(data) => {
                            save({ id: editingEntry?.id, ...data });
                            setEditingEntry(undefined);
                        }}
                        onDelete={editingEntry ? () => {
                            remove(editingEntry.id);
                            setEditingEntry(undefined);
                        } : undefined}
                        onClose={() => setEditingEntry(undefined)}
                    />
                )}
            </div>
        </div>
    );
}
