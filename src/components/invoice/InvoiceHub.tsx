'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvoiceStore, Invoice } from '@/hooks/useInvoiceStore';
import InvoiceEditor from './InvoiceEditor';

export default function InvoiceHub() {
    const { invoices, remove } = useInvoiceStore();
    const [editTarget, setEditTarget] = useState<Invoice | null | undefined>(undefined);
    // undefined = list view, null = new, Invoice = editing

    const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (editTarget !== undefined) {
        return (
            <div className="min-h-screen px-8 py-10">
                <InvoiceEditor
                    editInvoice={editTarget}
                    onSaved={() => setEditTarget(undefined)}
                    onCancel={() => setEditTarget(undefined)}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen px-8 py-10">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>🧾 Invoice Generator</h1>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} · 12 templates · GST/VAT ready
                        </p>
                    </div>
                    <button onClick={() => setEditTarget(null)}
                        className="px-5 py-2.5 rounded-2xl text-sm font-semibold themed-transition hover:brightness-110"
                        style={{ background: 'var(--accent)', color: '#000' }}>
                        + New Invoice
                    </button>
                </div>

                {invoices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                        <span className="text-6xl">🧾</span>
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>No invoices yet</h2>
                        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Create your first invoice with full GST/VAT support.</p>
                        <button onClick={() => setEditTarget(null)}
                            className="px-6 py-3 rounded-2xl text-sm font-semibold themed-transition hover:brightness-110"
                            style={{ background: 'var(--accent)', color: '#000' }}>
                            Create Invoice
                        </button>
                    </div>
                )}

                {invoices.length > 0 && (
                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        initial="hidden" animate="show"
                        variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
                        {invoices.map(inv => {
                            const subtotal = inv.items.reduce((s, i) => s + i.qty * i.rate, 0);
                            const tax = (subtotal * inv.taxRate) / 100;
                            const total = subtotal + tax;
                            const fmt = (n: number) => `${inv.currencySymbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                            return (
                                <motion.div key={inv.id}
                                    className="p-5 rounded-3xl flex flex-col gap-3 themed-transition hover:brightness-110 group"
                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>#{inv.invoiceNo}</p>
                                            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
                                                {inv.to.name || 'Unnamed Client'}
                                            </p>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded-full"
                                            style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
                                            {inv.template}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                                            Due {fmtDate(inv.dueDate)}
                                        </span>
                                        <span className="text-base font-black font-mono" style={{ color: 'var(--accent)' }}>
                                            {fmt(total)}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditTarget(inv)}
                                            className="flex-1 py-2 rounded-xl text-xs font-medium themed-transition"
                                            style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)' }}>
                                            ✏ Edit
                                        </button>
                                        <button onClick={() => remove(inv.id)}
                                            className="py-2 px-3 rounded-xl text-xs font-medium themed-transition"
                                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                            🗑
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
