'use client';

import { useState, useRef, useEffect } from 'react';
import type { DiaryEntry } from '@/hooks/useDiaryStore';

interface Props {
    entry: DiaryEntry | null;  // null = new entry
    onSave: (data: { title: string; body: string; category?: string; tasks?: string[] }) => void;
    onDelete?: () => void;
    onClose: () => void;
}

export default function DiaryEditor({ entry, onSave, onDelete, onClose }: Props) {
    const [title, setTitle] = useState(entry?.title ?? '');
    const [body, setBody] = useState(entry?.body ?? '');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        titleRef.current?.focus();
        if (typeof window !== 'undefined') {
            const SpeechRecognitionInfo = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognitionInfo) {
                const recognition = new SpeechRecognitionInfo();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (finalTranscript) {
                        setBody(prev => (prev + ' ' + finalTranscript).trim());
                    }
                };
                recognition.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    setIsRecording(false);
                };
                recognition.onend = () => {
                    setIsRecording(false);
                };
                recognitionRef.current = recognition;
            }
        }
    }, []);

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsRecording(true);
        }
    };

    const handleSave = () => {
        if (!title.trim() && !body.trim()) return;
        onSave({ title: title.trim() || 'Untitled', body });
    };

    const handleSmartSave = async () => {
        if (!body.trim()) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/diary/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: body })
            });

            if (res.ok) {
                const data = await res.json();
                onSave({
                    title: data.title || title.trim() || 'Untitled',
                    category: data.category,
                    body,
                    tasks: data.tasks
                });
            } else {
                handleSave(); // fallback
            }
        } catch (e) {
            console.error("Smart save failed", e);
            handleSave(); // fallback
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSendChat = async () => {
        if (!chatInput.trim() || isChatLoading) return;
        const newMsg = { role: 'user' as const, content: chatInput.trim() };
        const newHistory = [...chatMessages, newMsg];
        setChatMessages(newHistory);
        setChatInput('');
        setIsChatLoading(true);

        try {
            const res = await fetch('/api/diary/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newHistory,
                    entryTitle: title,
                    entryBody: body,
                })
            });
            if (res.ok) {
                const data = await res.json();
                setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            }
        } catch (e) {
            console.error("Chat failed", e);
        } finally {
            setIsChatLoading(false);
        }
    };

    useEffect(() => {
        if (showChat) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, showChat]);

    const handleInsertToDiary = (text: string) => {
        setBody(prev => prev ? prev + '\n\n' + text : text);
    };

    const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <div className="modal-enter flex h-full max-h-[90vh] w-full max-w-5xl gap-4">

                {/* Main Editor Panel */}
                <div className="flex-1 rounded-[2rem] flex flex-col shadow-2xl transition-all"
                    style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border2)',
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
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowChat(!showChat)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 themed-transition"
                                style={{ background: showChat ? 'var(--accent)' : 'var(--surface2)', color: showChat ? '#000' : 'var(--text)' }}>
                                🤖 AI Chat
                            </button>
                            {recognitionRef.current && (
                                <button
                                    onClick={toggleRecording}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 themed-transition"
                                    style={{ background: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'var(--surface2)', color: isRecording ? '#ef4444' : 'var(--text-dim)' }}>
                                    <span className={isRecording ? 'animate-pulse' : ''}>🎙️</span> {isRecording ? 'Listening...' : 'Dictate'}
                                </button>
                            )}
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
                                disabled={isProcessing}
                                className="px-5 py-2.5 rounded-2xl text-sm disabled:opacity-50"
                                style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                                Cancel
                            </button>
                            <button onClick={handleSmartSave}
                                disabled={isProcessing || !body.trim()}
                                className="px-6 py-2.5 rounded-2xl text-sm font-semibold themed-transition hover:brightness-110 disabled:opacity-50 flex items-center gap-2 block lg:flex"
                                style={{ background: 'var(--surface2)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                                {isProcessing ? 'Processing...' : '✨ Smart Save'}
                            </button>
                            <button onClick={handleSave}
                                disabled={isProcessing}
                                className="px-6 py-2.5 rounded-2xl text-sm font-semibold themed-transition hover:brightness-110 disabled:opacity-50"
                                style={{ background: 'var(--accent)', color: '#000' }}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Chat Sidebar */}
                {showChat && (
                    <div className="w-80 rounded-[2rem] flex flex-col shadow-2xl overflow-hidden glass-panel shrink-0"
                        style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--accent)',
                        }}>
                        <div className="px-4 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                                🤖 Horloge AI
                            </h3>
                            <button onClick={() => setShowChat(false)} className="text-xs opacity-50 hover:opacity-100 p-1" style={{ color: 'var(--text)' }}>✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-sm" style={{ backgroundColor: 'var(--bg)' }}>
                            {chatMessages.length === 0 && (
                                <p className="text-center opacity-50 italic text-xs mt-10" style={{ color: 'var(--text-dim)' }}>
                                    Need help writing or brainstorming? Just ask!
                                </p>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex flex-col max-w-[90%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
                                    <div className={`p-3 rounded-2xl ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                                        style={{
                                            background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface2)',
                                            color: msg.role === 'user' ? '#000' : 'var(--text)'
                                        }}>
                                        {msg.content}
                                    </div>
                                    {msg.role === 'assistant' && (
                                        <button onClick={() => handleInsertToDiary(msg.content)}
                                            className="self-start mt-1 px-2 py-1 text-[10px] font-semibold rounded opacity-60 hover:opacity-100 transition-opacity"
                                            style={{ color: 'var(--text)', background: 'var(--surface2)' }}>
                                            📥 Insert into entry
                                        </button>
                                    )}
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="self-start p-3 rounded-2xl rounded-bl-sm animate-pulse" style={{ background: 'var(--surface2)', color: 'var(--text)' }}>
                                    <span className="opacity-50">Thinking...</span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="p-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                                    placeholder="Ask AI..."
                                    className="flex-1 bg-transparent px-3 py-2 outline-none text-sm rounded-xl"
                                    style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                                />
                                <button onClick={handleSendChat} disabled={isChatLoading || !chatInput.trim()}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--accent)] text-black font-bold disabled:opacity-50 transition-all hover:scale-105 active:scale-95">
                                    ↑
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
