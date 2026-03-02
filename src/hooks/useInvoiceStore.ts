'use client';

import { useState, useEffect } from 'react';
import { getItem, setItem } from '@/lib/storage';

export interface LineItem {
    id: string;
    description: string;
    qty: number;
    rate: number;
}

export interface Invoice {
    id: string;
    template: string;
    invoiceNo: string;
    date: string;
    dueDate: string;
    from: { businessName: string; address: string; email: string; phone: string; gstin?: string; };
    to: { name: string; address: string; email: string; phone: string; gstin?: string; };
    items: LineItem[];
    taxRate: number;
    taxLabel: string;
    splitTax: boolean;
    currency: string;
    currencySymbol: string;
    notes: string;
    terms: string;
    createdAt: string;
    updatedAt: string;
}

const KEY = 'horloge_invoices';
const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useInvoiceStore() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    useEffect(() => {
        const load = () => setInvoices(getItem<Invoice[]>(KEY, []));
        load();
        window.addEventListener(`storage_${KEY}`, load);
        const onStorage = (e: StorageEvent) => { if (e.key === KEY) load(); };
        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener(`storage_${KEY}`, load);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    const save = (inv: Partial<Invoice> & { id?: string }): Invoice => {
        const now = new Date().toISOString();
        let saved!: Invoice;
        setInvoices(prev => {
            let next: Invoice[];
            if (inv.id) {
                next = prev.map(i => i.id === inv.id ? { ...i, ...inv, updatedAt: now } as Invoice : i);
                saved = next.find(i => i.id === inv.id)!;
            } else {
                saved = { ...inv, id: genId(), createdAt: now, updatedAt: now } as Invoice;
                next = [saved, ...prev];
            }
            setItem(KEY, next);
            return next;
        });
        return saved;
    };

    const remove = (id: string) => {
        setInvoices(prev => {
            const next = prev.filter(i => i.id !== id);
            setItem(KEY, next);
            return next;
        });
    };

    return { invoices, save, remove };
}
