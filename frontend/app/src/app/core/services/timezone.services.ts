import { Injectable } from '@angular/core';

interface JwtPayload { timezone_id?: string;[k: string]: unknown; }

@Injectable({ providedIn: 'root' })
export class TimezoneService {
    private readonly TOKEN_KEY = 'authToken';

    private b64urlDecode(input: string): string {
        const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
        const pad = b64.length % 4 ? 4 - (b64.length % 4) : 0;
        return atob(b64 + '='.repeat(pad));
    }

    private decodeToken(): JwtPayload | null {
        const token = localStorage.getItem(this.TOKEN_KEY);
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        try { return JSON.parse(this.b64urlDecode(parts[1])) as JwtPayload; }
        catch { return null; }
    }

    getTimezoneId(): string | null {
        console.log(this.decodeToken()?.timezone_id);
        return this.decodeToken()?.timezone_id ?? null;
    }

    /** Treats naive ISO strings as UTC */
    toDateAssumingUtc(input: string | number | Date): Date {
        if (input instanceof Date) return input;
        if (typeof input === 'number') return new Date(input);
        return /Z|[+-]\d{2}:\d{2}$/.test(input) ? new Date(input) : new Date(input + 'Z');
    }


    getTimeZone(): string {
        return this.getTimezoneId() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /** Y-M-D tuple in a specific time zone for calendar-day comparisons */
    getYmd(date: Date, tz: string): { y: number; m: number; d: number } {
        const fmt = new Intl.DateTimeFormat('en-CA', {
            timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
        });
        const [y, m, d] = fmt.format(date).split('-').map(n => Number(n));
        return { y, m, d };
    }

    isSameDay(a: Date, b: Date, tz: string): boolean {
        const A = this.getYmd(a, tz), B = this.getYmd(b, tz);
        return A.y === B.y && A.m === B.m && A.d === B.d;
    }

    isYesterday(d: Date, now: Date, tz: string): boolean {
        // Build "yesterday" by subtracting 1 calendar day in the same tz
        const parts = this.getYmd(now, tz);
        const yest = new Date(Date.UTC(parts.y, parts.m - 1, parts.d) - 24 * 60 * 60 * 1000);
        return this.isSameDay(d, yest, tz);
    }
}
