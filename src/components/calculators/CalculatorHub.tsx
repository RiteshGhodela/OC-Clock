'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import BMICalculator from './BMICalculator';
import AgeCalculator from './AgeCalculator';
import TimeCalculator from './TimeCalculator';
import FinanceCalculator from './FinanceCalculator';

const CALCS = [
    {
        id: 'bmi',
        title: 'BMI',
        icon: '⚖️',
        desc: 'Body Mass Index — metric & imperial',
        component: <BMICalculator />,
    },
    {
        id: 'age',
        title: 'Age',
        icon: '🎂',
        desc: 'Exact age + next birthday countdown',
        component: <AgeCalculator />,
    },
    {
        id: 'time',
        title: 'Time',
        icon: '⏳',
        desc: 'Duration, unit conversion & timezone diff',
        component: <TimeCalculator />,
    },
    {
        id: 'finance',
        title: 'Finance',
        icon: '💰',
        desc: 'Compound interest, EMI & SIP returns',
        component: <FinanceCalculator />,
    },
];

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};
const card = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function CalculatorHub() {
    const [active, setActive] = useState<string | null>(null);

    const activeCalc = CALCS.find(c => c.id === active);

    return (
        <div className="min-h-screen px-8 py-10">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    {active && (
                        <button onClick={() => setActive(null)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg themed-transition"
                            style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border2)' }}>
                            ←
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                            🧮 {active ? activeCalc?.title + ' Calculator' : 'Calculators'}
                        </h1>
                        {!active && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                                BMI · Age · Time · Finance
                            </p>
                        )}
                    </div>
                </div>

                {/* Grid */}
                {!active && (
                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                        variants={container} initial="hidden" animate="show">
                        {CALCS.map(c => (
                            <motion.button key={c.id} variants={card}
                                onClick={() => setActive(c.id)}
                                className="p-6 rounded-3xl text-left flex flex-col gap-3 themed-transition hover:brightness-110 group"
                                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                <span className="text-4xl">{c.icon}</span>
                                <div>
                                    <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{c.title} Calculator</h2>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{c.desc}</p>
                                </div>
                                <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                                    Open →
                                </span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}

                {/* Active calculator */}
                {active && activeCalc && (
                    <motion.div
                        className="rounded-3xl p-6"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}>
                        {activeCalc.component}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
