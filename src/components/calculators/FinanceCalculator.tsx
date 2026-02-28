'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

type FinanceTab = 'compound' | 'emi' | 'sip';

function MiniBarChart({ data, maxVal, color }: { data: number[]; maxVal: number; color: string }) {
    return (
        <div className="flex items-end gap-0.5 h-16 w-full">
            {data.map((v, i) => {
                const heightPct = Math.max(2, ((v / maxVal) || 0.01) * 64);
                return (
                    <motion.div key={i} className="flex-1 rounded-t-sm"
                        style={{ background: color, height: `${heightPct}px`, originY: 1 } as React.CSSProperties}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: i * 0.03, duration: 0.4, ease: 'easeOut' as const }}
                    />
                );
            })}
        </div>
    );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="flex items-center justify-between py-2 px-4 rounded-xl"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{label}</span>
            <span className="font-mono text-sm font-bold" style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}>{value}</span>
        </div>
    );
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);

// Strips leading zeros on blur while preserving decimals (e.g. "007" → "7", "0.5" → "0.5")
function sanitizeNum(val: string): string {
    if (!val || val === '-') return val;
    const n = parseFloat(val);
    return isNaN(n) ? val : String(n);
}

// Controlled numeric input that fixes leading zeros on blur
function NumInput({
    value, onChange, placeholder, step, className, style
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    step?: string;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <input
            type="number"
            value={value}
            placeholder={placeholder}
            step={step}
            className={className}
            style={style}
            onChange={e => onChange(e.target.value)}
            onBlur={e => onChange(sanitizeNum(e.target.value))}
        />
    );
}

export default function FinanceCalculator() {
    const [tab, setTab] = useState<FinanceTab>('compound');

    // Compound Interest
    const [ciPrincipal, setCiPrincipal] = useState('100000');
    const [ciRate, setCiRate] = useState('10');
    const [ciYears, setCiYears] = useState('5');
    const [ciFreq, setCiFreq] = useState('12');

    // EMI
    const [loanAmt, setLoanAmt] = useState('500000');
    const [loanRate, setLoanRate] = useState('8.5');
    const [loanTenure, setLoanTenure] = useState('20');

    // SIP
    const [sipAmt, setSipAmt] = useState('5000');
    const [sipRate, setSipRate] = useState('12');
    const [sipYears, setSipYears] = useState('10');

    const inputClass = 'w-full px-4 py-3 rounded-2xl text-sm outline-none themed-transition';
    const inputStyle = { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)' };

    // Compound
    const P = parseFloat(ciPrincipal) || 0;
    const r = (parseFloat(ciRate) || 0) / 100;
    const t = parseFloat(ciYears) || 0;
    const n = parseFloat(ciFreq) || 12;
    const ciAmount = P * Math.pow(1 + r / n, n * t);
    const ciInterest = ciAmount - P;
    const ciYearData = Array.from({ length: Math.max(1, Math.ceil(t)) }, (_, i) => {
        const yr = i + 1;
        return P * Math.pow(1 + r / n, n * yr);
    });

    // EMI
    const loan = parseFloat(loanAmt) || 0;
    const lR = (parseFloat(loanRate) || 0) / 100 / 12;
    const months = (parseFloat(loanTenure) || 0) * 12;
    const emi = lR > 0 && months > 0
        ? (loan * lR * Math.pow(1 + lR, months)) / (Math.pow(1 + lR, months) - 1)
        : 0;
    const totalPayment = emi * months;
    const totalInterest = totalPayment - loan;

    // SIP
    const sip = parseFloat(sipAmt) || 0;
    const sipR = (parseFloat(sipRate) || 0) / 100 / 12;
    const sipM = (parseFloat(sipYears) || 0) * 12;
    const sipMaturity = sipR > 0 && sipM > 0
        ? sip * ((Math.pow(1 + sipR, sipM) - 1) / sipR) * (1 + sipR)
        : sip * sipM;
    const sipInvested = sip * sipM;
    const sipGains = sipMaturity - sipInvested;
    const sipYearData = Array.from({ length: Math.max(1, Math.ceil(sipM / 12)) }, (_, i) => {
        const m = (i + 1) * 12;
        return sipR > 0 ? sip * ((Math.pow(1 + sipR, m) - 1) / sipR) * (1 + sipR) : sip * m;
    });

    return (
        <div className="flex flex-col gap-5">
            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface2)' }}>
                {([['compound', 'Compound'], ['emi', 'Loan EMI'], ['sip', 'SIP']] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setTab(id)}
                        className="flex-1 py-2 rounded-xl text-xs font-medium themed-transition"
                        style={tab === id ? { background: 'var(--accent)', color: '#000' } : { color: 'var(--text-dim)' }}>
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'compound' && (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>Principal (₹)</label>
                            <NumInput value={ciPrincipal} onChange={setCiPrincipal} placeholder="100000" className={inputClass} style={inputStyle} /></div>
                        <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>Annual Rate (%)</label>
                            <NumInput value={ciRate} onChange={setCiRate} step="0.1" className={inputClass} style={inputStyle} /></div>
                        <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>Years</label>
                            <NumInput value={ciYears} onChange={setCiYears} className={inputClass} style={inputStyle} /></div>
                        <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>Compounds/yr</label>
                            <select value={ciFreq} onChange={e => setCiFreq(e.target.value)} className={inputClass} style={inputStyle}>
                                <option value="1">Annual</option><option value="2">Half-Yearly</option>
                                <option value="4">Quarterly</option><option value="12">Monthly</option>
                            </select></div>
                    </div>
                    <MiniBarChart data={ciYearData} maxVal={Math.max(...ciYearData, 1)} color="var(--accent)" />
                    <div className="flex flex-col gap-2">
                        <Row label="Principal" value={`₹${fmt(P)}`} />
                        <Row label="Interest Earned" value={`₹${fmt(ciInterest)}`} />
                        <Row label="Total Amount" value={`₹${fmt(ciAmount)}`} accent />
                    </div>
                </div>
            )}

            {tab === 'emi' && (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>Loan Amount (₹)</label>
                            <NumInput value={loanAmt} onChange={setLoanAmt} className={inputClass} style={inputStyle} /></div>
                        <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>Interest Rate (%)</label>
                            <NumInput value={loanRate} onChange={setLoanRate} step="0.1" className={inputClass} style={inputStyle} /></div>
                        <div className="col-span-2"><label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>Tenure (years)</label>
                            <NumInput value={loanTenure} onChange={setLoanTenure} className={inputClass} style={inputStyle} /></div>
                    </div>
                    {emi > 0 && (
                        <motion.div className="flex flex-col gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="text-center py-4 rounded-2xl" style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
                                <p className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Monthly EMI</p>
                                <p className="text-4xl font-black font-mono" style={{ color: 'var(--accent)' }}>₹{fmt(emi)}</p>
                            </div>
                            <Row label="Principal" value={`₹${fmt(loan)}`} />
                            <Row label="Total Interest" value={`₹${fmt(totalInterest)}`} />
                            <Row label="Total Payment" value={`₹${fmt(totalPayment)}`} accent />
                        </motion.div>
                    )}
                </div>
            )}

            {tab === 'sip' && (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>Monthly SIP (₹)</label>
                            <NumInput value={sipAmt} onChange={setSipAmt} className={inputClass} style={inputStyle} /></div>
                        <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>Expected Return (%)</label>
                            <NumInput value={sipRate} onChange={setSipRate} step="0.5" className={inputClass} style={inputStyle} /></div>
                        <div className="col-span-2"><label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>Investment Period (years)</label>
                            <NumInput value={sipYears} onChange={setSipYears} className={inputClass} style={inputStyle} /></div>
                    </div>
                    <MiniBarChart data={sipYearData} maxVal={Math.max(...sipYearData, 1)} color="var(--accent)" />
                    <div className="flex flex-col gap-2">
                        <Row label="Total Invested" value={`₹${fmt(sipInvested)}`} />
                        <Row label="Wealth Gained" value={`₹${fmt(sipGains)}`} />
                        <Row label="Maturity Value" value={`₹${fmt(sipMaturity)}`} accent />
                    </div>
                </div>
            )}
        </div>
    );
}
