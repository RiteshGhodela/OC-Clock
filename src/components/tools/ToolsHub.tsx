'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';

interface ImageFile { file: File; url: string; name: string; }

export default function ToolsHub() {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [pdfIsGenerating, setPdfIsGenerating] = useState(false);
    const [done, setDone] = useState(false);
    const imgInput = useRef<HTMLInputElement>(null);

    const handleImageFiles = (files: FileList | null) => {
        if (!files) return;
        const newImgs: ImageFile[] = Array.from(files)
            .filter(f => f.type.startsWith('image/'))
            .map(f => ({ file: f, url: URL.createObjectURL(f), name: f.name }));
        setImages(prev => [...prev, ...newImgs]);
    };

    const removeImage = (idx: number) => {
        setImages(prev => { URL.revokeObjectURL(prev[idx].url); return prev.filter((_, i) => i !== idx); });
    };

    const generatePDF = async () => {
        if (images.length === 0) return;
        setPdfIsGenerating(true);
        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            for (let i = 0; i < images.length; i++) {
                if (i > 0) doc.addPage();
                const img = images[i];
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;
                const imageEl = new Image();
                imageEl.src = img.url;
                await new Promise<void>(res => { imageEl.onload = () => res(); });
                canvas.width = imageEl.naturalWidth;
                canvas.height = imageEl.naturalHeight;
                ctx.drawImage(imageEl, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                const ratio = Math.min(pageW / imageEl.naturalWidth, pageH / imageEl.naturalHeight);
                const w = imageEl.naturalWidth * ratio;
                const h = imageEl.naturalHeight * ratio;
                doc.addImage(dataUrl, 'JPEG', (pageW - w) / 2, (pageH - h) / 2, w, h);
            }
            doc.save('openclaw-export.pdf');
            setDone(true);
            setTimeout(() => setDone(false), 3000);
        } catch (err) {
            console.error('PDF generation failed:', err);
        }
        setPdfIsGenerating(false);
    };

    return (
        <div className="min-h-screen px-4 sm:px-8 py-10">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>🖼 Images to PDF</h1>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                        Combine multiple images into a single PDF. All processing is local — nothing is uploaded.
                    </p>
                </div>

                {/* Drop zone */}
                <motion.div
                    className="rounded-3xl p-10 flex flex-col items-center gap-3 cursor-pointer"
                    style={{ border: '2px dashed var(--border2)', background: 'var(--surface)' }}
                    onClick={() => imgInput.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleImageFiles(e.dataTransfer.files); }}
                    whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.99 }}>
                    <span className="text-5xl">🖼️</span>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {images.length > 0 ? `${images.length} image${images.length !== 1 ? 's' : ''} selected — click to add more` : 'Click or drag & drop images'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>JPG · PNG · WebP · GIF · AVIF</p>
                    <input ref={imgInput} type="file" multiple accept="image/*" className="hidden"
                        onChange={e => handleImageFiles(e.target.files)} />
                </motion.div>

                {/* Preview grid */}
                <AnimatePresence>
                    {images.length > 0 && (
                        <motion.div className="mt-6 flex flex-col gap-4"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                {images.map((img, i) => (
                                    <motion.div key={`${img.name}-${i}`}
                                        className="relative rounded-2xl overflow-hidden group"
                                        style={{ aspectRatio: '1', background: 'var(--surface2)' }}
                                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.03 }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            style={{ background: 'rgba(0,0,0,0.4)' }}>
                                            <button onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                                style={{ background: '#ef4444', color: '#fff' }}>✕</button>
                                        </div>
                                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
                                            style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>pg {i + 1}</span>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="flex gap-3 items-center">
                                <button onClick={generatePDF} disabled={pdfIsGenerating}
                                    className="flex-1 py-3 rounded-2xl font-semibold text-sm themed-transition hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                                    style={{ background: 'var(--accent)', color: '#000' }}>
                                    {pdfIsGenerating
                                        ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Generating…</>
                                        : `⬇ Download PDF (${images.length} page${images.length !== 1 ? 's' : ''})`}
                                </button>
                                <button onClick={() => setImages([])}
                                    className="px-5 py-3 rounded-2xl text-sm themed-transition"
                                    style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                                    Clear All
                                </button>
                                <AnimatePresence>
                                    {done && (
                                        <motion.span className="text-sm font-medium px-3 py-2 rounded-xl"
                                            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                                            ✓ Saved!
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
