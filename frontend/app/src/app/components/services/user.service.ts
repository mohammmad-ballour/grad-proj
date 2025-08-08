import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from '../../core/services/base.service';
import { catchError, Observable, throwError } from 'rxjs';
import { UpdatePriority } from "../models/UpdatePriority";
import { MuteDuration } from '../models/MuteDurationDto';

@Injectable({ providedIn: 'root' })
export class UserService extends BaseService {

  private readonly ENDPOINTS = {
    FOLLOW: '/api/users/follow/',
    UNFOLLOW: '/api/users/unfollow/',
    BLOCK: '/api/users/block/',
    UNBLOCK: '/api/users/unblock/',
    MUTE: '/api/users/mute/',
    UNMUTE: '/api/users/unmute/',
    UPDATE_PRIORITY: '/api/users/update-priority/'
  };

  constructor(private httpClient: HttpClient) {
    super();
  }

  private postAction(endpoint: string, userId: number, body: any = {}): Observable<void> {
    const url = `${this.baseUrl}${endpoint}${userId}`;
    return this.httpClient.post<void>(url, body).pipe(
      catchError(error => {
        console.error(`POST request failed to ${url}`, error);
        return throwError(() => error);
      })
    );
  }

  UpdatePriority(followedUserId: number, newPriority: string): Observable<void> {
    const url = `${this.baseUrl}${this.ENDPOINTS.UPDATE_PRIORITY}${followedUserId}`;
    const newPriorityObj: UpdatePriority = { priority: newPriority };
    return this.httpClient.patch<void>(url, newPriorityObj).pipe(
      catchError(error => {
        console.error('Error updating priority:', error);
        return throwError(() => error);
      })
    );
  }

  follow(userId: number): Observable<void> {
    return this.postAction(this.ENDPOINTS.FOLLOW, userId);
  }

  unfollow(userId: number): Observable<void> {
    return this.postAction(this.ENDPOINTS.UNFOLLOW, userId);
  }

  Block(userId: number): Observable<void> {
    return this.postAction(this.ENDPOINTS.BLOCK, userId);
  }

  UNBlock(userId: number): Observable<void> {
    return this.postAction(this.ENDPOINTS.UNBLOCK, userId);
  }

  Mute(userId: number, muteDuration: MuteDuration): Observable<void> {
    return this.postAction(this.ENDPOINTS.MUTE, userId, muteDuration);
  }

  Unmute(userId: number): Observable<void> {
    return this.postAction(this.ENDPOINTS.UNMUTE, userId);
  }
}
