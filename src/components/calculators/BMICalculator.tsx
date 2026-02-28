'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

function GaugeMeter({ value }: { value: number }) {
    // BMI range: 10–45
    const min = 10, max = 45;
    const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const segments = [
        { label: 'Under', color: '#60a5fa', end: (18.5 - min) / (max - min) },
        { label: 'Normal', color: '#4ade80', end: (25 - min) / (max - min) },
        { label: 'Over', color: '#fbbf24', end: (30 - min) / (max - min) },
        { label: 'Obese', color: '#f87171', end: 1 },
    ];

    return (
        <div className="w-full">
            <div className="relative h-4 rounded-full overflow-hidden"
                style={{ background: 'var(--surface2)' }}>
                <div className="absolute inset-0 flex">
                    <div style={{ width: '37%', background: '#60a5fa' }} />
                    <div style={{ width: '14%', background: '#4ade80' }} />
                    <div style={{ width: '11%', background: '#fbbf24' }} />
                    <div style={{ width: '38%', background: '#f87171' }} />
                </div>
                {value > 0 && (
                    <motion.div
                        className="absolute top-0 bottom-0 w-1.5 rounded-full bg-white shadow-lg"
                        style={{ left: `${pct * 100}%`, transform: 'translateX(-50%)' }}
                        animate={{ left: `${pct * 100}%` }}
                        transition={{ type: 'spring', stiffness: 200 }}
                    />
                )}
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                <span>Underweight</span>
                <span>Normal</span>
                <span>Overweight</span>
                <span>Obese</span>
            </div>
        </div>
    );
}

export default function BMICalculator() {
    const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [heightFt, setHeightFt] = useState('');
    const [heightIn, setHeightIn] = useState('');

    let bmi = 0;
    if (unit === 'metric') {
        const h = parseFloat(height) / 100;
        const w = parseFloat(weight);
        if (h > 0 && w > 0) bmi = w / (h * h);
    } else {
        const totalInches = parseFloat(heightFt) * 12 + parseFloat(heightIn || '0');
        const w = parseFloat(weight);
        if (totalInches > 0 && w > 0) bmi = (w / (totalInches * totalInches)) * 703;
    }

    const category =
        bmi <= 0 ? '' :
            bmi < 18.5 ? 'Underweight' :
                bmi < 25 ? 'Normal weight' :
                    bmi < 30 ? 'Overweight' : 'Obese';

    const categoryColor =
        bmi < 18.5 ? '#60a5fa' :
            bmi < 25 ? '#4ade80' :
                bmi < 30 ? '#fbbf24' : '#f87171';

    const inputClass = 'w-full px-4 py-3 rounded-2xl text-sm outline-none themed-transition';
    const inputStyle = { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)' };

    return (
        <div className="flex flex-col gap-6">
            {/* Unit toggle */}
            <div className="flex gap-2">
                {(['metric', 'imperial'] as const).map(u => (
                    <button key={u} onClick={() => setUnit(u)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium themed-transition capitalize"
                        style={unit === u ? { background: 'var(--accent)', color: '#000' } : { background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                        {u}
                    </button>
                ))}
            </div>

            {unit === 'metric' ? (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Height (cm)</label>
                        <input type="number" placeholder="170" value={height} onChange={e => setHeight(e.target.value)}
                            className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                        <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Weight (kg)</label>
                        <input type="number" placeholder="70" value={weight} onChange={e => setWeight(e.target.value)}
                            className={inputClass} style={inputStyle} />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Feet</label>
                        <input type="number" placeholder="5" value={heightFt} onChange={e => setHeightFt(e.target.value)}
                            className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                        <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Inches</label>
                        <input type="number" placeholder="9" value={heightIn} onChange={e => setHeightIn(e.target.value)}
                            className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                        <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-dim)' }}>Weight (lbs)</label>
                        <input type="number" placeholder="154" value={weight} onChange={e => setWeight(e.target.value)}
                            className={inputClass} style={inputStyle} />
                    </div>
                </div>
            )}

            {bmi > 0 && (
                <motion.div className="flex flex-col gap-4"
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-4xl font-black font-mono" style={{ color: categoryColor }}>
                                {bmi.toFixed(1)}
                            </p>
                            <p className="text-sm font-medium mt-1" style={{ color: categoryColor }}>{category}</p>
                        </div>
                        <div className="text-xs text-right" style={{ color: 'var(--text-dim)' }}>
                            <p>{'<'}18.5 Underweight</p>
                            <p>18.5–24.9 Normal</p>
                            <p>25–29.9 Overweight</p>
                            <p>{'≥'}30 Obese</p>
                        </div>
                    </div>
                    <GaugeMeter value={bmi} />
                </motion.div>
            )}
        </div>
    );
}
