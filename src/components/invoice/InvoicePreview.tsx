'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '@/hooks/useInvoiceStore';
import { QRCodeSVG } from 'qrcode.react';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
interface Props {
    invoice: Invoice;
    subtotal: number;
    taxResult: { taxLabel: string; taxAmount: number; parts?: { label: string; amount: number }[] };
    total: number;
}

type ExportFormat = 'pdf' | 'png' | 'jpg' | 'webp' | 'svg';

const A4_W_PX = 794; // 210mm × 3.7795 px/mm
const A4_H_PX = 1123;

// ────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ────────────────────────────────────────────────────────────────────────────
const fmtNum = (sym: string, n: number) =>
    `${sym}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function TaxRows({ taxResult, fmt }: { taxResult: Props['taxResult']; fmt: (n: number) => string }) {
    if (taxResult.parts) {
        return <>{taxResult.parts.map(p => (
            <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12, color: '#888' }}>
                <span>{p.label}</span><span>{fmt(p.amount)}</span>
            </div>
        ))}</>;
    }
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12, color: '#888' }}>
            <span>{taxResult.taxLabel}</span><span>{fmt(taxResult.taxAmount)}</span>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1: CLASSIC BLUE — full-page, two-column header + navy sidebar totals
// ────────────────────────────────────────────────────────────────────────────
function TemplateClassic({ inv, subtotal, taxResult, total }: Props & { inv: Invoice }) {
    const fmt = (n: number) => fmtNum(inv.currencySymbol, n);
    return (
        <div style={{ width: A4_W_PX, minHeight: A4_H_PX, fontFamily: 'Georgia, serif', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            {/* Navy header bar */}
            <div style={{ background: '#0f2557', padding: '40px 56px 32px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>{inv.from.businessName || 'Your Business'}</div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8, whiteSpace: 'pre-wrap', maxWidth: 280 }}>{inv.from.address}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{inv.from.email} · {inv.from.phone}</div>
                    {inv.from.gstin && <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>GSTIN: {inv.from.gstin}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: 4, opacity: 0.15, lineHeight: 1 }}>INV</div>
                    <div style={{ fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '4px 14px', display: 'inline-block', marginTop: 8 }}># {inv.invoiceNo}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>Date: {inv.date}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>Due: {inv.dueDate}</div>
                </div>
            </div>

            {/* Blue diagonal accent */}
            <div style={{ height: 8, background: 'linear-gradient(90deg, #1a6ef7, #06b6d4)' }} />

            {/* Bill To section */}
            <div style={{ padding: '32px 56px 24px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ background: '#f8faff', border: '1px solid #dbeafe', borderRadius: 10, padding: '20px 24px', minWidth: 240 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#1a6ef7', textTransform: 'uppercase', marginBottom: 10 }}>Bill To</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{inv.to.name || '—'}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, whiteSpace: 'pre-wrap' }}>{inv.to.address}</div>
                    {inv.to.email && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{inv.to.email}</div>}
                    {inv.to.gstin && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>GSTIN: {inv.to.gstin}</div>}
                </div>
                <div style={{ textAlign: 'right', opacity: 0.7 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#1a6ef7', textTransform: 'uppercase', marginBottom: 10 }}>Amount Due</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: '#0f2557', fontFamily: 'monospace' }}>{fmt(total)}</div>
                </div>
            </div>

            {/* Items table */}
            <div style={{ padding: '0 56px', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ background: '#0f2557', color: '#fff' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderRadius: '4px 0 0 0' }}>#</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Unit Price</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, borderRadius: '0 4px 0 0' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inv.items.map((item, i) => (
                            <tr key={item.id} style={{ background: i % 2 === 0 ? '#f8faff' : '#fff', borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '12px 16px', color: '#94a3b8', fontFamily: 'monospace' }}>{String(i + 1).padStart(2, '0')}</td>
                                <td style={{ padding: '12px 16px', color: '#1e293b' }}>{item.description}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#475569' }}>{item.qty}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#475569', fontFamily: 'monospace' }}>{fmt(item.rate)}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0f2557', fontFamily: 'monospace' }}>{fmt(item.qty * item.rate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                    <div style={{ minWidth: 280, background: '#f8faff', border: '1px solid #dbeafe', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid #dbeafe' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 6 }}><span>Subtotal</span><span style={{ fontFamily: 'monospace' }}>{fmt(subtotal)}</span></div>
                            <TaxRows taxResult={taxResult} fmt={fmt} />
                        </div>
                        <div style={{ padding: '14px 24px', background: '#0f2557', color: '#fff', display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
                            <span>TOTAL</span><span style={{ fontFamily: 'monospace' }}>{fmt(total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ margin: '32px 56px 0', padding: '24px 0', borderTop: '2px solid #dbeafe', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, fontSize: 12, color: '#64748b' }}>
                {inv.notes && <div><div style={{ fontWeight: 700, color: '#0f2557', marginBottom: 4 }}>Notes</div><div>{inv.notes}</div></div>}
                {inv.terms && <div><div style={{ fontWeight: 700, color: '#0f2557', marginBottom: 4 }}>Terms & Conditions</div><div>{inv.terms}</div></div>}
            </div>
            <div style={{ padding: '20px 56px 40px', textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
                Thank you for your business · {inv.from.email}
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2: MINIMAL BOLD — large typography, stark B&W, left accent stripe
// ────────────────────────────────────────────────────────────────────────────
function TemplateMinimal({ inv, subtotal, taxResult, total }: Props & { inv: Invoice }) {
    const fmt = (n: number) => fmtNum(inv.currencySymbol, n);
    return (
        <div style={{ width: A4_W_PX, minHeight: A4_H_PX, fontFamily: '"Inter", "Helvetica Neue", sans-serif', background: '#fafafa', display: 'flex' }}>
            {/* Left accent stripe */}
            <div style={{ width: 6, background: '#111', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '56px 56px 40px 50px' }}>
                {/* Top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
                    <div>
                        <div style={{ fontSize: 11, letterSpacing: 3, color: '#888', textTransform: 'uppercase', marginBottom: 12 }}>Invoice</div>
                        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, color: '#111', letterSpacing: -3 }}>{inv.invoiceNo}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>{inv.from.businessName || 'BRAND'}</div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 6, whiteSpace: 'pre-wrap' }}>{inv.from.address}</div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{inv.from.email}</div>
                    </div>
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', gap: 40, marginBottom: 40, paddingBottom: 32, borderBottom: '2px solid #111' }}>
                    {[['Bill To', inv.to.name || '—', inv.to.address], ['Date', inv.date, ''], ['Due Date', inv.dueDate, '']].map(([label, val, sub]) => (
                        <div key={label}>
                            <div style={{ fontSize: 10, letterSpacing: 2, color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{val}</div>
                            {sub && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{sub}</div>}
                        </div>
                    ))}
                </div>

                {/* Items */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0 24px', fontSize: 10, letterSpacing: 2, color: '#888', textTransform: 'uppercase', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #ddd' }}>
                        <span>Description</span><span>Qty</span><span style={{ textAlign: 'right' }}>Rate</span><span style={{ textAlign: 'right' }}>Total</span>
                    </div>
                    {inv.items.map((item, i) => (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0 24px', padding: '14px 0', borderBottom: '1px solid #ebebeb', fontSize: 14, color: '#111', alignItems: 'center' }}>
                            <span style={{ fontWeight: 500 }}>{item.description}</span>
                            <span style={{ fontFamily: 'monospace', color: '#666' }}>{item.qty}</span>
                            <span style={{ fontFamily: 'monospace', color: '#666', textAlign: 'right' }}>{fmt(item.rate)}</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, textAlign: 'right' }}>{fmt(item.qty * item.rate)}</span>
                        </div>
                    ))}
                </div>

                {/* Totals block */}
                <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 240px', gap: 32, alignItems: 'end' }}>
                    <div>
                        {inv.notes && <div><div style={{ fontSize: 10, letterSpacing: 2, color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>Notes</div><div style={{ fontSize: 12, color: '#666' }}>{inv.notes}</div></div>}
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', padding: '6px 0' }}><span>Subtotal</span><span style={{ fontFamily: 'monospace' }}>{fmt(subtotal)}</span></div>
                        <TaxRows taxResult={taxResult} fmt={fmt} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 900, color: '#111', padding: '14px 0', marginTop: 8, borderTop: '2px solid #111' }}>
                            <span>Total</span><span style={{ fontFamily: 'monospace' }}>{fmt(total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3: GST INDIA — formal tabular layout with CGST/SGST columns
// ────────────────────────────────────────────────────────────────────────────
function TemplateGST({ inv, subtotal, taxResult, total }: Props & { inv: Invoice }) {
    const fmt = (n: number) => fmtNum(inv.currencySymbol, n);
    const halfTax = taxResult.taxAmount / 2;
    return (
        <div style={{ width: A4_W_PX, minHeight: A4_H_PX, fontFamily: 'Arial, sans-serif', background: '#fff', fontSize: 12 }}>
            {/* Header */}
            <div style={{ background: '#1b4f72', color: '#fff', padding: '28px 48px 24px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{inv.from.businessName || 'Business Name'}</div>
                    <div style={{ opacity: 0.7, marginTop: 6, whiteSpace: 'pre-wrap', fontSize: 11 }}>{inv.from.address}</div>
                    {inv.from.gstin && <div style={{ marginTop: 6, fontSize: 11, background: 'rgba(255,255,255,0.1)', display: 'inline-block', padding: '2px 10px', borderRadius: 4 }}>GSTIN: {inv.from.gstin}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2 }}>TAX INVOICE</div>
                    <div style={{ fontSize: 12, marginTop: 8, opacity: 0.8 }}>No.: {inv.invoiceNo}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>Date: {inv.date} | Due: {inv.dueDate}</div>
                </div>
            </div>

            {/* Party details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #1b4f72', padding: '0' }}>
                {[
                    { title: 'Billed By', party: inv.from },
                    { title: 'Billed To', party: inv.to },
                ].map(({ title, party }) => (
                    <div key={title} style={{ padding: '20px 32px', borderRight: title === 'Billed By' ? '1px solid #ddd' : 'none' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#1b4f72', textTransform: 'uppercase', marginBottom: 8 }}>{title}</div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{title === 'Billed By' ? (party as typeof inv.from).businessName : (party as typeof inv.to).name}</div>
                        <div style={{ color: '#555', marginTop: 4, whiteSpace: 'pre-wrap', fontSize: 11 }}>{party.address}</div>
                        <div style={{ color: '#555', fontSize: 11 }}>{party.email} {party.phone ? `· ${party.phone}` : ''}</div>
                        {party.gstin && <div style={{ color: '#777', fontSize: 10, marginTop: 4 }}>GSTIN: {party.gstin}</div>}
                    </div>
                ))}
            </div>

            {/* Items table with HSN + GST columns */}
            <div style={{ padding: '0 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                        <tr style={{ background: '#1b4f72', color: '#fff' }}>
                            {['S.No', 'Description', 'Qty', 'Rate', 'Taxable Amount', 'CGST', 'SGST', 'Total'].map((h, i) => (
                                <th key={h} style={{ padding: '10px 12px', textAlign: i >= 2 ? 'right' : 'left', fontWeight: 600, fontSize: 10 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {inv.items.map((item, i) => {
                            const taxable = item.qty * item.rate;
                            const itemCGST = (taxable * (inv.taxRate / 2)) / 100;
                            const itemSGST = itemCGST;
                            return (
                                <tr key={item.id} style={{ background: i % 2 === 0 ? '#f0f7ff' : '#fff', borderBottom: '1px solid #ddd', fontSize: 11 }}>
                                    <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                                    <td style={{ padding: '10px 12px' }}>{item.description}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.qty}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(item.rate)}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(taxable)}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#1b4f72' }}>{fmt(itemCGST)}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#1b4f72' }}>{fmt(itemSGST)}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmt(taxable + itemCGST + itemSGST)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: '#e8f0f7', fontWeight: 700 }}>
                            <td colSpan={4} style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12 }}>Totals</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(subtotal)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#1b4f72' }}>{fmt(halfTax)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#1b4f72' }}>{fmt(halfTax)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', background: '#1b4f72', color: '#fff' }}>{fmt(total)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Summary box */}
            <div style={{ padding: '24px 48px', display: 'grid', gridTemplateColumns: '1fr 220px', gap: 32, marginTop: 16 }}>
                <div>
                    {inv.notes && <div style={{ background: '#f0f7ff', padding: 16, borderRadius: 8, border: '1px solid #bee3f8' }}>
                        <div style={{ fontWeight: 700, color: '#1b4f72', marginBottom: 4, fontSize: 11 }}>Notes</div>
                        <div style={{ color: '#555', fontSize: 11 }}>{inv.notes}</div>
                    </div>}
                    {inv.terms && <div style={{ marginTop: 12, background: '#fffbeb', padding: 12, borderRadius: 8, border: '1px solid #fde68a' }}>
                        <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 4, fontSize: 11 }}>Terms</div>
                        <div style={{ color: '#78350f', fontSize: 10 }}>{inv.terms}</div>
                    </div>}
                </div>
                <div style={{ background: '#1b4f72', color: '#fff', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8 }}><span>Taxable</span><span style={{ fontFamily: 'monospace' }}>{fmt(subtotal)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8 }}><span>CGST ({inv.taxRate / 2}%)</span><span style={{ fontFamily: 'monospace' }}>{fmt(halfTax)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8 }}><span>SGST ({inv.taxRate / 2}%)</span><span style={{ fontFamily: 'monospace' }}>{fmt(halfTax)}</span></div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}><span>Grand Total</span><span style={{ fontFamily: 'monospace' }}>{fmt(total)}</span></div>
                </div>
            </div>
            <div style={{ padding: '0 48px 32px', fontSize: 10, textAlign: 'center', color: '#aaa' }}>
                This is a computer generated invoice. · GSTIN: {inv.from.gstin || 'N/A'}
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// TEMPLATE 4: AGENCY / CREATIVE — bold gradient, large imagery layout
// ────────────────────────────────────────────────────────────────────────────
function TemplateAgency({ inv, subtotal, taxResult, total }: Props & { inv: Invoice }) {
    const fmt = (n: number) => fmtNum(inv.currencySymbol, n);
    return (
        <div style={{ width: A4_W_PX, minHeight: A4_H_PX, fontFamily: '"Inter", "Helvetica Neue", sans-serif', background: '#09090b', color: '#fff', display: 'flex', flexDirection: 'column' }}>
            {/* Large gradient header */}
            <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)', padding: '56px 56px 40px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: -40, left: 100, width: 160, height: 160, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>{inv.from.businessName || 'AGENCY'}</div>
                        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 8 }}>{inv.from.address} · {inv.from.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: 8, padding: '6px 16px', display: 'inline-block' }}>INVOICE # {inv.invoiceNo}</div>
                        <div style={{ fontSize: 11, opacity: 0.75, marginTop: 8 }}>{inv.date} · Due {inv.dueDate}</div>
                    </div>
                </div>
                {/* Total big */}
                <div style={{ marginTop: 32, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.7 }}>Amount Due</div>
                <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, letterSpacing: -2, marginTop: 4 }}>{fmt(total)}</div>
            </div>

            {/* Client info band */}
            <div style={{ background: '#18181b', padding: '24px 56px', display: 'flex', gap: 48 }}>
                <div>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: '#71717a', textTransform: 'uppercase', marginBottom: 6 }}>Billed To</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{inv.to.name}</div>
                    <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 2 }}>{inv.to.address}</div>
                </div>
            </div>

            {/* Items */}
            <div style={{ flex: 1, padding: '32px 56px' }}>
                <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px', gap: 16, fontSize: 10, letterSpacing: 2, color: '#71717a', textTransform: 'uppercase', paddingBottom: 12, borderBottom: '1px solid #27272a' }}>
                    <span>Description</span><span style={{ textAlign: 'center' }}>Qty</span><span style={{ textAlign: 'right' }}>Rate</span><span style={{ textAlign: 'right' }}>Amount</span>
                </div>
                {inv.items.map((item) => (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px', gap: 16, padding: '14px 0', borderBottom: '1px solid #27272a', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{item.description}</span>
                        <span style={{ textAlign: 'center', color: '#a1a1aa', fontSize: 13 }}>{item.qty}</span>
                        <span style={{ textAlign: 'right', color: '#a1a1aa', fontFamily: 'monospace', fontSize: 13 }}>{fmt(item.rate)}</span>
                        <span style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>{fmt(item.qty * item.rate)}</span>
                    </div>
                ))}

                {/* Total */}
                <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ minWidth: 280 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: 13, padding: '6px 0' }}><span>Subtotal</span><span style={{ fontFamily: 'monospace' }}>{fmt(subtotal)}</span></div>
                        <TaxRows taxResult={taxResult} fmt={fmt} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', borderRadius: 10, marginTop: 12, fontSize: 18, fontWeight: 900 }}>
                            <span>Total Due</span><span style={{ fontFamily: 'monospace' }}>{fmt(total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            {(inv.notes || inv.terms) && (
                <div style={{ padding: '0 56px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {inv.notes && <div style={{ background: '#18181b', padding: 16, borderRadius: 10 }}>
                        <div style={{ fontSize: 10, color: '#8b5cf6', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Notes</div>
                        <div style={{ fontSize: 12, color: '#a1a1aa' }}>{inv.notes}</div>
                    </div>}
                    {inv.terms && <div style={{ background: '#18181b', padding: 16, borderRadius: 10 }}>
                        <div style={{ fontSize: 10, color: '#8b5cf6', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Terms</div>
                        <div style={{ fontSize: 12, color: '#a1a1aa' }}>{inv.terms}</div>
                    </div>}
                </div>
            )}
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// TEMPLATE 5: RETRO RECEIPT — dot matrix, monospace, old-school thermal
// ────────────────────────────────────────────────────────────────────────────
function TemplateRetro({ inv, subtotal, taxResult, total }: Props & { inv: Invoice }) {
    const fmt = (n: number) => fmtNum(inv.currencySymbol, n);
    const sep = '─'.repeat(56);
    return (
        <div style={{ width: A4_W_PX, minHeight: A4_H_PX, fontFamily: '"Courier New", Courier, monospace', background: '#fffef8', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <div style={{ width: '100%', maxWidth: 520 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', borderBottom: '3px double #333', paddingBottom: 12, marginBottom: 12 }}>
                        *** INVOICE ***
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>{(inv.from.businessName || 'BUSINESS').toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{inv.from.address}</div>
                    <div style={{ fontSize: 11, color: '#555' }}>{inv.from.email} · {inv.from.phone}</div>
                    {inv.from.gstin && <div style={{ fontSize: 10, color: '#777', marginTop: 2 }}>GSTIN: {inv.from.gstin}</div>}
                </div>

                <div style={{ fontSize: 12, color: '#555' }}>{sep}</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '16px 0', fontSize: 12 }}>
                    <div><span style={{ color: '#888' }}>INV#: </span><span style={{ fontWeight: 700 }}>{inv.invoiceNo}</span></div>
                    <div><span style={{ color: '#888' }}>DATE: </span><span>{inv.date}</span></div>
                    <div><span style={{ color: '#888' }}>TO: </span><span style={{ fontWeight: 700 }}>{inv.to.name}</span></div>
                    <div><span style={{ color: '#888' }}>DUE: </span><span>{inv.dueDate}</span></div>
                </div>
                {inv.to.gstin && <div style={{ fontSize: 10, color: '#888', marginBottom: 8 }}>CLIENT GSTIN: {inv.to.gstin}</div>}

                <div style={{ fontSize: 12, color: '#555' }}>{sep}</div>

                <div style={{ margin: '16px 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 90px 90px', gap: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>
                        <span>Description</span><span style={{ textAlign: 'center' }}>Qty</span><span style={{ textAlign: 'right' }}>Rate</span><span style={{ textAlign: 'right' }}>Amount</span>
                    </div>
                    {inv.items.map((item) => (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 90px 90px', gap: 4, padding: '8px 0', borderBottom: '1px dashed #ccc', fontSize: 12 }}>
                            <span>{item.description}</span>
                            <span style={{ textAlign: 'center' }}>{item.qty}</span>
                            <span style={{ textAlign: 'right' }}>{fmt(item.rate)}</span>
                            <span style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(item.qty * item.rate)}</span>
                        </div>
                    ))}
                </div>

                <div style={{ fontSize: 12, color: '#555' }}>{sep}</div>

                <div style={{ margin: '16px 0 0', fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#555' }}><span>SUBTOTAL</span><span>{fmt(subtotal)}</span></div>
                    <TaxRows taxResult={taxResult} fmt={fmt} />
                    <div style={{ fontSize: 12, color: '#555' }}>{sep}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', fontSize: 20, fontWeight: 900 }}><span>*** TOTAL</span><span>{fmt(total)} ***</span></div>
                </div>

                <div style={{ fontSize: 12, color: '#555', marginTop: 16 }}>{sep}</div>
                <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#777', lineHeight: 1.8 }}>
                    <div>{inv.notes || 'THANK YOU FOR YOUR BUSINESS!'}</div>
                    <div style={{ marginTop: 8, fontSize: 10 }}>{inv.terms}</div>
                    <div style={{ marginTop: 16, fontSize: 9, color: '#aaa' }}>*** COMPUTER GENERATED DOCUMENT ***</div>
                </div>
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Template map
// ────────────────────────────────────────────────────────────────────────────
type TplFn = React.FC<Props & { inv: Invoice }>;
const TEMPLATE_MAP: Record<string, TplFn> = {
    'classic': TemplateClassic,
    'minimal': TemplateMinimal,
    'bold': TemplateMinimal,
    'freelancer': TemplateMinimal,
    'gst-india': TemplateGST,
    'eu-vat': TemplateClassic,
    'agency': TemplateAgency,
    'tech': TemplateAgency,
    'retro': TemplateRetro,
    'corporate': TemplateClassic,
    'creative': TemplateAgency,
    'receipt': TemplateRetro,
};

// ────────────────────────────────────────────────────────────────────────────
// Export helpers
// ────────────────────────────────────────────────────────────────────────────
async function captureCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
    return html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#fff', width: A4_W_PX, windowWidth: A4_W_PX });
}

async function exportAs(format: ExportFormat, el: HTMLElement, fileName: string): Promise<void> {
    if (format === 'pdf') {
        const canvas = await captureCanvas(el);
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        // Scale to fit A4 width, allow multiple pages if taller
        const ratio = canvas.width / pageW;
        const imgH = canvas.height / ratio;
        if (imgH <= pageH) {
            pdf.addImage(imgData, 'JPEG', 0, 0, pageW, imgH);
        } else {
            let y = 0;
            while (y < imgH) {
                if (y > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, -y, pageW, imgH);
                y += pageH;
            }
        }
        pdf.save(`${fileName}.pdf`);
        return;
    }
    const canvas = await captureCanvas(el);
    if (format === 'svg') {
        // SVG wrapper around the canvas image
        const dataUrl = canvas.toDataURL('image/png');
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width}" height="${canvas.height}"><image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/></svg>`;
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${fileName}.svg`; a.click();
        URL.revokeObjectURL(url);
        return;
    }
    const mimeMap: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
    const quality = format === 'jpg' ? 0.95 : undefined;
    const dataUrl = canvas.toDataURL(mimeMap[format], quality);
    const a = document.createElement('a'); a.href = dataUrl; a.download = `${fileName}.${format}`; a.click();
}

// ────────────────────────────────────────────────────────────────────────────
// Main InvoicePreview component
// ────────────────────────────────────────────────────────────────────────────
const FORMAT_OPTIONS: { id: ExportFormat; label: string; icon: string }[] = [
    { id: 'pdf', label: 'PDF', icon: '📄' },
    { id: 'png', label: 'PNG', icon: '🖼' },
    { id: 'jpg', label: 'JPG', icon: '📷' },
    { id: 'webp', label: 'WEBP', icon: '🌐' },
    { id: 'svg', label: 'SVG', icon: '✏️' },
];

export default function InvoicePreview({ invoice, subtotal, taxResult, total }: Props) {
    const previewRef = useRef<HTMLDivElement>(null);
    const qrContent = `Invoice #${invoice.invoiceNo} | ${invoice.from.businessName} | Total: ${invoice.currencySymbol}${total.toFixed(2)} | Due: ${invoice.dueDate}`;

    const [exporting, setExporting] = useState<ExportFormat | null>(null);
    const [showFormats, setShowFormats] = useState(false);
    const [exportDone, setExportDone] = useState(false);

    const fileName = `invoice-${invoice.invoiceNo}`;

    const handleExport = async (format: ExportFormat) => {
        if (!previewRef.current) return;
        setExporting(format);
        setShowFormats(false);
        try {
            await exportAs(format, previewRef.current, fileName);
            setExportDone(true);
            setTimeout(() => setExportDone(false), 3000);
        } catch (e) {
            console.error(e);
        }
        setExporting(null);
    };

    const TemplateComponent = TEMPLATE_MAP[invoice.template] ?? TemplateClassic;

    return (
        <div className="flex flex-col gap-5">
            {/* Export toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                    <button
                        onClick={() => setShowFormats(o => !o)}
                        disabled={!!exporting}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold themed-transition hover:brightness-110 disabled:opacity-50"
                        style={{ background: 'var(--accent)', color: '#000' }}>
                        {exporting ? `Exporting ${exporting.toUpperCase()}…` : '⬇ Download'}
                        <span className="text-xs opacity-70">{showFormats ? '▲' : '▼'}</span>
                    </button>
                    <AnimatePresence>
                        {showFormats && (
                            <motion.div
                                className="absolute top-12 left-0 z-50 rounded-2xl overflow-hidden flex flex-col"
                                style={{ background: 'var(--surface)', border: '1px solid var(--border2)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', minWidth: 160 }}
                                initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                transition={{ duration: 0.18 }}>
                                {FORMAT_OPTIONS.map(f => (
                                    <button key={f.id} onClick={() => handleExport(f.id)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-left themed-transition hover:brightness-125"
                                        style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>
                                        <span>{f.icon}</span> {f.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Export done flash */}
                <AnimatePresence>
                    {exportDone && (
                        <motion.div
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                            ✓ Downloaded!
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* QR code — rendered live via qrcode.react SVG */}
                <div className="flex items-center gap-2 ml-auto">
                    <div className="text-right">
                        <p className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Scan for info</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Invoice QR</p>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{ width: 60, height: 60, border: '2px solid var(--border2)', background: '#fff', padding: 4 }}>
                        <QRCodeSVG value={qrContent} size={52} fgColor="#0f2557" bgColor="#ffffff" level="M" />
                    </div>
                </div>
            </div>

            {/* Invoice preview with animated entrance */}
            <motion.div
                className="overflow-auto rounded-3xl"
                style={{ border: '1px solid var(--border2)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', background: '#fff' }}
                initial={{ opacity: 0, y: 32, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' as const }}>
                {/* Shimmer on load */}
                <motion.div
                    style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)', zIndex: 1, pointerEvents: 'none' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.2, ease: 'easeInOut' as const, delay: 0.2 }}
                />
                <div ref={previewRef} style={{ position: 'relative' }}>
                    <TemplateComponent inv={invoice} invoice={invoice} subtotal={subtotal} taxResult={taxResult} total={total} />
                </div>
            </motion.div>
        </div>
    );
}
