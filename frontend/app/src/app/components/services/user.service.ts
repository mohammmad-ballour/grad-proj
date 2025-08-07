import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BaseService} from '../../core/services/base.service';
import {catchError, Observable, throwError} from 'rxjs';
import {UpdatePriority} from "../models/UpdatePriority";

@Injectable({providedIn: 'root'})
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
  UpdatePriority(followedUserId: number, newPriority: string): Observable<void> {
    const url = `${this.baseUrl}${this.ENDPOINTS.UPDATE_PRIORITY}${followedUserId}`;
    const newPriorityObj: UpdatePriority = {priority: newPriority};
    return this.httpClient.patch<void>(url, newPriorityObj).pipe(
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
