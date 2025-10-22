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
}
