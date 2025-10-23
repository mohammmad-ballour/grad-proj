import { ChangeDetectionStrategy, Pipe, PipeTransform } from '@angular/core';
import { TimezoneService } from '../services/timezone.services';

@Pipe({ name: 'chatTimeLabel', standalone: true, pure: true })
export class ChatTimeLabelPipe implements PipeTransform {
    constructor(private tzSvc: TimezoneService) { }

    transform(value: string | number | Date, locale = navigator.language): string {
        if (!value) return '';
        const tz = this.tzSvc.getTimeZone();
        const date = this.tzSvc.toDateAssumingUtc(value);
        const now = new Date();

        // Today?
        if (this.tzSvc.isSameDay(date, now, tz)) {
            // HH:mm in the user's zone
            return new Intl.DateTimeFormat(locale, {
                timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false
            }).format(date);
        }

        // Yesterday?
        if (this.tzSvc.isYesterday(date, now, tz)) {
            try {
                return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-1, 'day'); // "Yesterday"
            } catch {
                return 'Yesterday';
            }
        }

        // Older: date only (MMM d if same year, else MMM d, y)
        const sameYear =
            this.tzSvc.getYmd(date, tz).y === this.tzSvc.getYmd(now, tz).y;

        const opts: Intl.DateTimeFormatOptions = sameYear
            ? { month: 'short', day: 'numeric', timeZone: tz }
            : { month: 'short', day: 'numeric', year: 'numeric', timeZone: tz };

        return new Intl.DateTimeFormat(locale, opts).format(date);
    }
}
