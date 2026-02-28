export interface TaxRegion {
    label: string;          // e.g. 'GST', 'VAT', 'Sales Tax'
    defaultRate: number;    // percentage, e.g. 18
    split: boolean;         // India splits GST into CGST+SGST
    splitLabel?: string[];  // e.g. ['CGST', 'SGST']
    currency: string;
    currencySymbol: string;
}

const REGIONS: Record<string, TaxRegion> = {
    IN: { label: 'GST', defaultRate: 18, split: true, splitLabel: ['CGST', 'SGST'], currency: 'INR', currencySymbol: '₹' },
    US: { label: 'Sales Tax', defaultRate: 8, split: false, currency: 'USD', currencySymbol: '$' },
    GB: { label: 'VAT', defaultRate: 20, split: false, currency: 'GBP', currencySymbol: '£' },
    AU: { label: 'GST', defaultRate: 10, split: false, currency: 'AUD', currencySymbol: 'A$' },
    CA: { label: 'HST', defaultRate: 13, split: false, currency: 'CAD', currencySymbol: '$' },
    SG: { label: 'GST', defaultRate: 9, split: false, currency: 'SGD', currencySymbol: 'S$' },
    AE: { label: 'VAT', defaultRate: 5, split: false, currency: 'AED', currencySymbol: 'AED' },
    EU: { label: 'VAT', defaultRate: 20, split: false, currency: 'EUR', currencySymbol: '€' },
    DEFAULT: { label: 'Tax', defaultRate: 0, split: false, currency: 'USD', currencySymbol: '$' },
};

export function detectTaxRegion(): TaxRegion {
    try {
        const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
        const country = locale.split('-').pop()?.toUpperCase() ?? '';
        const region = REGIONS[country];
        if (region) return region;
        // EU detection (common locales)
        const euLocales = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'PL', 'SE', 'AT', 'PT', 'FI', 'DK', 'GR', 'CZ', 'HU', 'RO'];
        if (euLocales.includes(country)) return { ...REGIONS.EU };
        return REGIONS.DEFAULT;
    } catch {
        return REGIONS.DEFAULT;
    }
}

export function calculateTax(
    subtotal: number,
    rate: number,
    split: boolean
): { taxLabel: string; taxAmount: number; parts?: { label: string; amount: number }[] } {
    const taxAmount = (subtotal * rate) / 100;
    if (split) {
        const half = taxAmount / 2;
        return {
            taxLabel: `Tax (${rate}%)`,
            taxAmount,
            parts: [
                { label: `CGST (${rate / 2}%)`, amount: half },
                { label: `SGST (${rate / 2}%)`, amount: half },
            ],
        };
    }
    return { taxLabel: `Tax (${rate}%)`, taxAmount };
}

export const ALL_REGIONS = REGIONS;
