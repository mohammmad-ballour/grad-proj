import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { BaseService } from '../../../core/services/base.service';
import { MuteDuration } from '../models/MuteDurationDto';
import { Injectable } from '@angular/core';
import { UpdatePriority } from '../models/UpdatePriority';

// Matches backend UserSeekResponse.java
export interface UserResponse {
  userAvatar: {
    userId: number; username: string; displayName: string; profilePicture: string | null;
  }
  profileBio: string | null;
  isVerified: boolean;
  isFollowedByCurrentUser: boolean | null;
  isFollowingCurrentUser: boolean | null;
  canBeMessagedByCurrentUser: boolean | null;
  canBeAddedToGroupByCurrentUser: boolean | null;
}




@Injectable({ providedIn: 'root' })
export class UserService extends BaseService {


  http: any;

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


  /** Get followings for a user */
  getFollowings(userId: number, lastPage: number): Observable<UserResponse[]> {
    return this.httpClient.get<UserResponse[]>(`${this.baseUrl}${this.ENDPOINTS.USERS}${userId}/followings`, {
      params: {
        page: lastPage.toString()
      }
    });
  }

  getFollowers(userId: number, lastPage: number): Observable<UserResponse[]> {
    return this.httpClient.get<UserResponse[]>(`${this.baseUrl}${this.ENDPOINTS.USERS}${userId}/followers`, {
      params: {
        page: lastPage.toString()
      }
    });
  }


  getMutualFollowings(userId: number, lastPage: number): Observable<UserResponse[]> {

    return this.httpClient.get<UserResponse[]>(
      ` ${this.baseUrl}${this.ENDPOINTS.USERS}${userId}/mutual-followings`,

      {
        params: {
          page: lastPage.toString()
        }
      }
    );
  }
}
