import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private unreadMessagesSubject = new BehaviorSubject<number>(0);
    private unreadNotificationsSubject = new BehaviorSubject<number>(0);

    unreadMessagesCount$ = this.unreadMessagesSubject.asObservable();
    unreadNotificationsCount$ = this.unreadNotificationsSubject.asObservable();

    updateUnreadCounts(messages: number, notifications: number): void {
        this.unreadMessagesSubject.next(messages);
        this.unreadNotificationsSubject.next(notifications);
    }
}