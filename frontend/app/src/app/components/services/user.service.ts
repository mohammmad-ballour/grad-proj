import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {BaseService} from '../../core/services/base.service';
import {UpdatePriority} from '../models/UpdatePriority';
import {MuteDuration} from '../models/MuteDurationDto';

// Matches backend UserSeekResponse.java
export interface UserSeekResponse {
  userId: number;
  displayName: string;
  userName: string;
  profilePicture: string | null; // Base64 encoded
  actionHappenedAt: string;      // ISO string
  profileBio: string | null;
  Verified: boolean
  followedByCurrentUser: boolean
}

@Injectable({ providedIn: 'root' })
export class UserService extends BaseService {

  private readonly ENDPOINTS = {
    FOLLOW: '/api/users/follow/',
    UNFOLLOW: '/api/users/unfollow/',
    BLOCK: '/api/users/block/',
    UNBLOCK: '/api/users/unblock/',
    MUTE: '/api/users/mute/',
    UNMUTE: '/api/users/unmute/',
    UPDATE_PRIORITY: '/api/users/update-priority/',
    USERS: '/api/users/' // base for followings/followers/mutual
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

  // ===== Action methods =====
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


  /** Get followings for a user */
  getFollowings(userId: number, lastPage: number): Observable<UserSeekResponse[]> {
    return this.httpClient.get<UserSeekResponse[]>(`${this.baseUrl}${this.ENDPOINTS.USERS}${userId}/followings`, {
      params: {
        page: lastPage.toString()
      }
    });
  }

  getFollowers(userId: number, lastPage: number): Observable<UserSeekResponse[]> {
    return this.httpClient.get<UserSeekResponse[]>(`${this.baseUrl}${this.ENDPOINTS.USERS}${userId}/followers`, {
      params: {
        page: lastPage.toString()
      }
    });
  }



}
