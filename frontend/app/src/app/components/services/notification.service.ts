import { HttpClient, HttpParams } from "@angular/common/http";
import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import { NotificationDto } from "../notifications/models/notification.model";
import {BaseService} from '../../core/services/base.service';
import {AuthService} from '../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService extends BaseService {
  private unreadMessagesSubject = new BehaviorSubject<number>(0);
  private unreadNotificationsSubject = new BehaviorSubject<number>(0);

  unreadMessagesCount$ = this.unreadMessagesSubject.asObservable();
  unreadNotificationsCount$ = this.unreadNotificationsSubject.asObservable();

  updateUnreadCounts(messages: number, notifications: number): void {
    this.unreadMessagesSubject.next(messages);
    this.unreadNotificationsSubject.next(notifications);
  }

  constructor(private http: HttpClient, private authServices: AuthService) {
    super();
  }

  /** Fetch notifications (paginated) */
  notificationsUrl: string = `${this.baseUrl}${this.ENDPOINTS.notifications}`;
  getNotifications(page: number = 0): Observable<NotificationDto[]> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<NotificationDto[]>(this.notificationsUrl, {params});
  }

  /** Mark selected notifications as read */
  markAsRead(unreadNotifications: number[]): Observable<void> {
    return this.http.post<void>(`${this.notificationsUrl}/mark-as-read`, unreadNotifications);
  }
}
