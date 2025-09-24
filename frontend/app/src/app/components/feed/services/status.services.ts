import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BaseService } from '../../../core/services/base.service';
import { StatusWithRepliesResponse } from '../models/StatusWithRepliesResponseDto';
import { FeedResponse } from '../models/feed-responseDto';



@Injectable({ providedIn: 'root' })
export class StatusServices extends BaseService {
    constructor(private httpClient: HttpClient, private authService: AuthService) {
        super();
    }
    getStatusById(statusId: string): Observable<StatusWithRepliesResponse> {
        return this.httpClient.get<StatusWithRepliesResponse>(`${this.baseUrl}${this.ENDPOINTS.PUBLICSTATUS}${statusId}`)

    }

    fetchUserFeed(page: number = 0): Observable<FeedResponse> {
        return this.httpClient.post<FeedResponse>(`${this.baseUrl}/api/users/feed?page=${page}`, {});
    }
}

