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
    createStatus(toCreate: any, mediaFiles?: File[]): Observable<string> {
        const formData = new FormData();
        formData.append('request', new Blob([JSON.stringify(toCreate)], { type: 'application/json' }));
        if (mediaFiles && mediaFiles.length > 0) {
            mediaFiles.forEach(file => formData.append('media', file));
        }
        return this.httpClient.post<string>(`${this.baseUrl}/api/status`, formData);
    }


}

