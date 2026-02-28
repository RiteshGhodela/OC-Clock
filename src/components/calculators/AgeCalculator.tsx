'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

function StatPill({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl flex-1"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
            <span className="text-xl font-black font-mono" style={{ color: 'var(--accent)' }}>{value}</span>
            <span className="text-[11px] text-center leading-tight" style={{ color: 'var(--text-dim)' }}>{label}</span>
        </div>
    );
}

export default function AgeCalculator() {
    const [dob, setDob] = useState('');

    const today = new Date();
    let years = 0, months = 0, days = 0, hours = 0, totalDays = 0;
    let nextBirthdayDays = 0;
    let nextBirthday = '';

    if (dob) {
        const birth = new Date(dob);
        if (!isNaN(birth.getTime()) && birth <= today) {
            years = today.getFullYear() - birth.getFullYear();
            months = today.getMonth() - birth.getMonth();
            days = today.getDate() - birth.getDate();

            if (days < 0) {
                months -= 1;
                const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                days += prevMonth.getDate();
            }
            if (months < 0) { years -= 1; months += 12; }

            totalDays = Math.floor((today.getTime() - birth.getTime()) / 86400000);
            hours = Math.floor((today.getTime() - birth.getTime()) / 3600000);

            // Next birthday
            let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
            if (next <= today) next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
            nextBirthdayDays = Math.ceil((next.getTime() - today.getTime()) / 86400000);
            nextBirthday = next.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        }
    }

    const valid = Boolean(dob && years >= 0);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--text-dim)' }}>Date of Birth</label>
                <input
                    type="date"
                    value={dob}
                    max={today.toISOString().split('T')[0]}
                    onChange={e => setDob(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)' }}
                />
            </div>

            {valid && (
                <motion.div className="flex flex-col gap-4"
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Big age display */}
                    <div className="flex items-baseline gap-3 justify-center py-4">
                        <span className="text-6xl font-black font-mono" style={{ color: 'var(--accent)' }}>{years}</span>
                        <span className="text-xl font-medium" style={{ color: 'var(--text-dim)' }}>years</span>
                        <span className="text-4xl font-black font-mono" style={{ color: 'var(--text)' }}>{months}</span>
                        <span className="text-sm" style={{ color: 'var(--text-dim)' }}>months</span>
                        <span className="text-4xl font-black font-mono" style={{ color: 'var(--text)' }}>{days}</span>
                        <span className="text-sm" style={{ color: 'var(--text-dim)' }}>days</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <StatPill label="Total Days" value={totalDays.toLocaleString()} />
                        <StatPill label="Total Hours" value={hours.toLocaleString()} />
                        <StatPill label="Total Weeks" value={Math.floor(totalDays / 7).toLocaleString()} />
                    </div>

                    {/* Next birthday */}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                        style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
                        <span className="text-2xl">🎂</span>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                                Next birthday: {nextBirthday}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                                in {nextBirthdayDays} day{nextBirthdayDays !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
