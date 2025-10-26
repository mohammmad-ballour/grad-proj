import { ChangeDetectorRef, NgZone, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { TimezoneService } from '../services/timezone.services';

type TimeAgoStyle = 'short' | 'long' | 'narrow';

@Pipe({ name: 'timeAgo', standalone: true, pure: false })
export class TimeAgoPipe implements PipeTransform, OnDestroy {
    private timer: any;

    constructor(
        private cdr: ChangeDetectorRef,
        private zone: NgZone,
        private tz: TimezoneService
    ) { }

    ngOnDestroy(): void {
        if (this.timer) clearInterval(this.timer);
    }

    transform(
        value: string | number | Date,
        style: TimeAgoStyle = 'short',
        locale = navigator.language
    ): string {
        if (!value) return '';
        console.log(this.tz.getTimezoneId())
        const date = this.tz.toDateAssumingUtc(value);
        const now = Date.now();
        const diff = (now - date.getTime()) / 1000; // seconds

        // Start/refresh a 30s ticker outside Angular to keep string fresh
        this._ensureTimer();

        // Future guard
        if (diff < 5) return this._format(0, 'second', style, locale, true);

        const { value: relValue, unit } = this._bestUnit(diff);
        return this._format(-relValue, unit, style, locale); // negative => "ago"
    }

    private _ensureTimer() {
        if (this.timer) return;
        this.zone.runOutsideAngular(() => {
            this.timer = setInterval(() => {
                this.zone.run(() => this.cdr.markForCheck());
            }, 30_000);
        });
    }

    private _bestUnit(seconds: number): { value: number; unit: Intl.RelativeTimeFormatUnit } {
        const mins = seconds / 60;
        const hours = mins / 60;
        const days = hours / 24;
        const weeks = days / 7;
        const months = days / 30.4375; // avg
        const years = days / 365.25;

        if (seconds < 60) return { value: Math.round(seconds), unit: 'second' };
        if (mins < 60) return { value: Math.round(mins), unit: 'minute' };
        if (hours < 24) return { value: Math.round(hours), unit: 'hour' };
        if (days < 7) return { value: Math.round(days), unit: 'day' };
        if (weeks < 5) return { value: Math.round(weeks), unit: 'week' };
        if (months < 12) return { value: Math.round(months), unit: 'month' };
        return { value: Math.round(years), unit: 'year' };
    }

    private _format(
        value: number,
        unit: Intl.RelativeTimeFormatUnit,
        style: TimeAgoStyle,
        locale: string,
        justNow = false
    ): string {
        if (justNow) {
            // localized "just now"
            try {
                const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style });
                return rtf.format(0, 'second');
            } catch {
                return 'just now';
            }
        }
        try {
            const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style });
            return rtf.format(value, unit);
        } catch {
            // Minimal fallback for environments without RelativeTimeFormat
            const abs = Math.abs(value);
            const shortUnit =
                unit === 'second' ? 's' :
                    unit === 'minute' ? 'm' :
                        unit === 'hour' ? 'h' :
                            unit === 'day' ? 'd' :
                                unit === 'week' ? 'w' :
                                    unit === 'month' ? 'mo' : 'y';
            return `${abs}${shortUnit} ago`;
        }
    }
}
