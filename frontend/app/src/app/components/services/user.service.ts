import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseService } from '../../core/services/base.service';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService extends BaseService {

  // API Endpoints
  private readonly ENDPOINTS = {
    FOLLOW: '/api/users/follow/',
    UNFOLLOW: '/api/users/unfollow/',
    BLOCK: '/api/users/block/',
    MUTE: '/api/users/toMute/',
    UPDATE_PRIORITY: '/api/users/update-priority/'
  };

  constructor(private httpClient: HttpClient) {
    super();
  }

  // 🔁 Shared POST handler
  private postAction(endpoint: string, userId: number): Observable<void> {
    const url = `${this.baseUrl}${endpoint}${userId}`;
    return this.httpClient.post<void>(url, {}).pipe(
      catchError(error => {
        console.error(`POST request failed to ${url}`, error);
        return throwError(() => error);
      })
    );
  }

  // ✅ Priority update (PATCH)
  UpdatePriority(userId: number, priorityName: string): Observable<void> {
    const url = `${this.baseUrl}${this.ENDPOINTS.UPDATE_PRIORITY}${userId}`;
    const params = new HttpParams().set('newPriority', priorityName);

    return this.httpClient.patch<void>(url, params).pipe(
      catchError(error => {
        console.error('Error updating priority:', error);
        return throwError(() => error);
      })
    );
  }

  // 🔁 Follow/Unfollow/Block/Mute actions
  follow(userId: number): Observable<void> {
    return this.postAction(this.ENDPOINTS.FOLLOW, userId);
  }

  unfollow(userId: number): Observable<void> {
    return this.postAction(this.ENDPOINTS.UNFOLLOW, userId);
  }

  ToggleBlock(userId: number): Observable<void> {
    return this.postAction(this.ENDPOINTS.BLOCK, userId);
  }

  // ToggleMute(userId: number): Observable<void> {
  //   return this.postAction(this.ENDPOINTS.MUTE, userId);
  // }
}
