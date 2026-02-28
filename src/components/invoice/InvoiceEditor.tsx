'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvoiceStore, Invoice, LineItem } from '@/hooks/useInvoiceStore';
import { detectTaxRegion, calculateTax, ALL_REGIONS, TaxRegion } from '@/lib/tax';
import InvoicePreview from './InvoicePreview';

const TEMPLATES = [
    { id: 'classic', label: 'Classic', desc: 'Clean serif business style' },
    { id: 'minimal', label: 'Minimal', desc: 'Mono font, top color strip' },
    { id: 'bold', label: 'Bold Business', desc: 'Dark header, white text' },
    { id: 'freelancer', label: 'Freelancer', desc: 'Warm, modern, personal' },
    { id: 'gst-india', label: 'GST India', desc: 'CGST + SGST split format' },
    { id: 'eu-vat', label: 'EU VAT', desc: 'European VAT format' },
    { id: 'agency', label: 'Agency', desc: 'Colorful, bold gradient' },
    { id: 'tech', label: 'Tech Startup', desc: 'Dark mono code aesthetic' },
    { id: 'retro', label: 'Retro', desc: 'Dot-matrix receipt style' },
    { id: 'corporate', label: 'Corporate', desc: 'Formal structured layout' },
    { id: 'creative', label: 'Creative', desc: 'Artistic header, vibrant' },
    { id: 'receipt', label: 'Simple Receipt', desc: 'Minimal single-column' },
];

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function makeDefaultInvoice(region: TaxRegion): Partial<Invoice> {
    const today = new Date();
    const due = new Date(today); due.setDate(due.getDate() + 30);
    return {
        template: 'classic',
        invoiceNo: `INV-${String(Date.now()).slice(-6)}`,
        date: today.toISOString().split('T')[0],
        dueDate: due.toISOString().split('T')[0],
        from: { businessName: '', address: '', email: '', phone: '', gstin: '' },
        to: { name: '', address: '', email: '', phone: '', gstin: '' },
        items: [{ id: genId(), description: 'Service / Product', qty: 1, rate: 0 }],
        taxRate: region.defaultRate,
        taxLabel: region.label,
        splitTax: region.split,
        currency: region.currency,
        currencySymbol: region.currencySymbol,
        notes: 'Thank you for your business!',
        terms: 'Payment due within 30 days.',
    };
}

interface Props {
    editInvoice?: Invoice | null;
    onSaved: () => void;
    onCancel: () => void;
}

export default function InvoiceEditor({ editInvoice, onSaved, onCancel }: Props) {
    const { save } = useInvoiceStore();
    const region = detectTaxRegion();
    const [inv, setInv] = useState<Partial<Invoice>>(
        editInvoice ?? makeDefaultInvoice(region)
    );
    const [showPreview, setShowPreview] = useState(false);
    const [saving, setSaving] = useState(false);

    const setField = (path: string, value: unknown) => {
        setInv(prev => {
            const parts = path.split('.');
            if (parts.length === 1) return { ...prev, [path]: value };
            const [top, sub] = parts;
            return { ...prev, [top]: { ...(prev as Record<string, unknown>)[top] as object, [sub]: value } };
        });
    };

    const addItem = () => setInv(prev => ({
        ...prev,
        items: [...(prev.items ?? []), { id: genId(), description: '', qty: 1, rate: 0 }],
    }));

    const removeItem = (id: string) => setInv(prev => ({
        ...prev, items: (prev.items ?? []).filter(i => i.id !== id),
    }));

    // Store qty/rate as strings to allow partial editing, strip leading zeros on blur
    const [itemStrings, setItemStrings] = useState<Record<string, { qty: string; rate: string }>>({});

    const getItemStr = (id: string, field: 'qty' | 'rate', numeric: number) =>
        itemStrings[id]?.[field] ?? String(numeric);

    const setItemStr = (id: string, field: 'qty' | 'rate', val: string) => {
        setItemStrings(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
        const n = parseFloat(val);
        if (!isNaN(n)) updateItemNum(id, field, n);
    };

    const blurItemStr = (id: string, field: 'qty' | 'rate', val: string) => {
        const n = parseFloat(val);
        const clean = isNaN(n) ? '0' : String(n);
        setItemStrings(prev => ({ ...prev, [id]: { ...prev[id], [field]: clean } }));
        updateItemNum(id, field, isNaN(n) ? 0 : n);
    };

    const updateItemNum = (id: string, field: keyof LineItem, value: string | number) => {
        setInv(prev => ({
            ...prev,
            items: (prev.items ?? []).map(i => i.id === id ? { ...i, [field]: value } : i),
        }));
    };

    const updateItem = updateItemNum;

    const subtotal = (inv.items ?? []).reduce((s, i) => s + i.qty * i.rate, 0);
    const taxResult = calculateTax(subtotal, inv.taxRate ?? 0, inv.splitTax ?? false);
    const total = subtotal + taxResult.taxAmount;

    const handleSave = () => {
        setSaving(true);
        save(inv);
        setSaving(false);
        onSaved();
    };

    const fmt = (n: number) => `${inv.currencySymbol ?? '$'}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const inputClass = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none themed-transition';
    const inputStyle = { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)' };
    const labelClass = 'text-[11px] font-medium mb-1 block';
    const labelStyle = { color: 'var(--text-dim)' };

    return (
        <AnimatePresence>
            {showPreview ? (
                <motion.div className="fixed inset-0 z-50 flex flex-col overflow-auto"
                    style={{ background: 'var(--bg)' }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="flex items-center gap-3 px-8 py-4 sticky top-0 z-10"
                        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                        <button onClick={() => setShowPreview(false)}
                            className="px-4 py-2 rounded-xl text-sm themed-transition"
                            style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                            ← Edit
                        </button>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Invoice Preview</span>
                    </div>
                    <div className="flex-1 px-8 py-6 overflow-auto">
                        <InvoicePreview invoice={inv as Invoice} subtotal={subtotal} taxResult={taxResult} total={total} />
                    </div>
                </motion.div>
            ) : (
                <div className="flex flex-col gap-6 max-w-3xl mx-auto">
                    {/* Template selector */}
                    <div>
                        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Template</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {TEMPLATES.map(t => (
                                <button key={t.id}
                                    onClick={() => setField('template', t.id)}
                                    className="p-3 rounded-2xl text-left text-xs themed-transition"
                                    style={{
                                        background: inv.template === t.id ? 'var(--surface2)' : 'transparent',
                                        border: `1px solid ${inv.template === t.id ? 'var(--accent)' : 'var(--border)'}`,
                                        boxShadow: inv.template === t.id ? '0 0 0 1px var(--accent)' : 'none',
                                        color: inv.template === t.id ? 'var(--text)' : 'var(--text-dim)',
                                    }}>
                                    <p className="font-semibold">{t.label}</p>
                                    <p className="opacity-60 mt-0.5" style={{ fontSize: '10px' }}>{t.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Basic info */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className={labelClass} style={labelStyle}>Invoice #</label>
                            <input className={inputClass} style={inputStyle} value={inv.invoiceNo ?? ''} onChange={e => setField('invoiceNo', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass} style={labelStyle}>Date</label>
                            <input type="date" className={inputClass} style={inputStyle} value={inv.date ?? ''} onChange={e => setField('date', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass} style={labelStyle}>Due Date</label>
                            <input type="date" className={inputClass} style={inputStyle} value={inv.dueDate ?? ''} onChange={e => setField('dueDate', e.target.value)} />
                        </div>
                    </div>

                    {/* From / To */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(['from', 'to'] as const).map(side => (
                            <div key={side} className="flex flex-col gap-2 p-4 rounded-2xl"
                                style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
                                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                                    {side === 'from' ? '📤 From (You)' : '📥 To (Client)'}
                                </p>
                                {(['businessName', 'address', 'email', 'phone', 'gstin'] as const).map(field => (
                                    <div key={field}>
                                        <label className={labelClass} style={labelStyle}>
                                            {field === 'businessName' ? (side === 'from' ? 'Business Name' : 'Client Name') :
                                                field === 'gstin' ? 'GSTIN / Tax ID (optional)' :
                                                    field.charAt(0).toUpperCase() + field.slice(1)}
                                        </label>
                                        <input
                                            className={inputClass}
                                            style={{ ...inputStyle, background: 'var(--surface)' }}
                                            value={(inv[side] as Record<string, string>)?.[field] ?? ''}
                                            onChange={e => setField(`${side}.${field}`, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Line items */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Line Items</h2>
                            <button onClick={addItem}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium themed-transition"
                                style={{ background: 'var(--accent)', color: '#000' }}>
                                + Add Item
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-2 px-2 text-[11px]" style={{ color: 'var(--text-dim)' }}>
                                <span className="col-span-6">Description</span>
                                <span className="col-span-2 text-center">Qty</span>
                                <span className="col-span-2 text-right">Rate</span>
                                <span className="col-span-2 text-right">Amount</span>
                            </div>
                            {(inv.items ?? []).map((item, idx) => (
                                <motion.div key={item.id}
                                    className="grid grid-cols-12 gap-2 items-center"
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                    <input className="col-span-6 px-3 py-2 rounded-xl text-sm outline-none"
                                        style={inputStyle}
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={e => updateItem(item.id, 'description', e.target.value)} />
                                    <input type="number" className="col-span-2 px-3 py-2 rounded-xl text-sm outline-none text-center"
                                        style={inputStyle}
                                        value={getItemStr(item.id, 'qty', item.qty)}
                                        onChange={e => setItemStr(item.id, 'qty', e.target.value)}
                                        onBlur={e => blurItemStr(item.id, 'qty', e.target.value)} />
                                    <input type="number" className="col-span-2 px-3 py-2 rounded-xl text-sm outline-none text-right"
                                        style={inputStyle}
                                        value={getItemStr(item.id, 'rate', item.rate)}
                                        onChange={e => setItemStr(item.id, 'rate', e.target.value)}
                                        onBlur={e => blurItemStr(item.id, 'rate', e.target.value)} />
                                    <div className="col-span-2 flex items-center justify-end gap-1">
                                        <span className="text-sm font-mono" style={{ color: 'var(--text)' }}>
                                            {fmt(item.qty * item.rate)}
                                        </span>
                                        {(inv.items ?? []).length > 1 && (
                                            <button onClick={() => removeItem(item.id)}
                                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                                                style={{ color: '#ef4444', opacity: 0.7 }}>✕</button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Tax settings */}
                    <div className="p-4 rounded-2xl flex flex-col gap-3"
                        style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Tax Settings</p>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className={labelClass} style={labelStyle}>Region</label>
                                <select className={inputClass} style={{ ...inputStyle, background: 'var(--surface)' }}
                                    onChange={e => {
                                        const r = ALL_REGIONS[e.target.value] ?? ALL_REGIONS.DEFAULT;
                                        setField('taxRate', r.defaultRate);
                                        setField('taxLabel', r.label);
                                        setField('splitTax', r.split);
                                        setField('currency', r.currency);
                                        setField('currencySymbol', r.currencySymbol);
                                    }}>
                                    {Object.entries(ALL_REGIONS).map(([k, r]) => (
                                        <option key={k} value={k}>{k === 'DEFAULT' ? 'Other' : k} — {r.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass} style={labelStyle}>Tax Label</label>
                                <input className={inputClass} style={{ ...inputStyle, background: 'var(--surface)' }}
                                    value={inv.taxLabel ?? ''} onChange={e => setField('taxLabel', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass} style={labelStyle}>Tax Rate (%)</label>
                                <input type="number" className={inputClass} style={{ ...inputStyle, background: 'var(--surface)' }}
                                    value={inv.taxRate ?? 0} onChange={e => setField('taxRate', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-dim)' }}>
                            <input type="checkbox" checked={inv.splitTax ?? false}
                                onChange={e => setField('splitTax', e.target.checked)}
                                className="w-4 h-4 rounded accent-current" />
                            Split into CGST + SGST (India GST)
                        </label>
                    </div>

                    {/* Totals */}
                    <div className="flex flex-col gap-1.5 max-w-xs ml-auto text-sm">
                        <div className="flex justify-between" style={{ color: 'var(--text-dim)' }}>
                            <span>Subtotal</span><span className="font-mono">{fmt(subtotal)}</span>
                        </div>
                        {taxResult.parts ? taxResult.parts.map(p => (
                            <div key={p.label} className="flex justify-between" style={{ color: 'var(--text-dim)' }}>
                                <span>{p.label}</span><span className="font-mono">{fmt(p.amount)}</span>
                            </div>
                        )) : (
                            <div className="flex justify-between" style={{ color: 'var(--text-dim)' }}>
                                <span>{taxResult.taxLabel}</span><span className="font-mono">{fmt(taxResult.taxAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-bold pt-1.5" style={{ color: 'var(--text)', borderTop: '1px solid var(--border2)' }}>
                            <span>Total</span><span className="font-mono" style={{ color: 'var(--accent)' }}>{fmt(total)}</span>
                        </div>
                    </div>

                    {/* Notes & Terms */}
                    <div className="grid grid-cols-2 gap-4">
                        {([['notes', 'Notes'], ['terms', 'Terms & Conditions']] as const).map(([field, label]) => (
                            <div key={field}>
                                <label className={labelClass} style={labelStyle}>{label}</label>
                                <textarea rows={3}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                                    style={inputStyle}
                                    value={inv[field] ?? ''}
                                    onChange={e => setField(field, e.target.value)} />
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pb-4">
                        <button onClick={onCancel}
                            className="px-5 py-3 rounded-2xl text-sm themed-transition"
                            style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                            Cancel
                        </button>
                        <button onClick={() => setShowPreview(true)}
                            className="flex-1 py-3 rounded-2xl text-sm font-semibold themed-transition"
                            style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--accent)' }}>
                            👁 Preview
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className="flex-1 py-3 rounded-2xl text-sm font-semibold themed-transition hover:brightness-110 disabled:opacity-50"
                            style={{ background: 'var(--accent)', color: '#000' }}>
                            {saving ? 'Saving…' : '💾 Save Invoice'}
                        </button>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}
