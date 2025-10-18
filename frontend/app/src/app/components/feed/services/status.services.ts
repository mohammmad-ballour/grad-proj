import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BaseService } from '../../../core/services/base.service';
import { CreateStatusRequest, StatusWithRepliesResponse } from '../models/StatusWithRepliesResponseDto';
import { FeedResponse } from '../models/feed-responseDto';

@Injectable({ providedIn: 'root' })
export class StatusServices extends BaseService {
    constructor(private httpClient: HttpClient, private authService: AuthService) {
        super();
    }

    getStatusById(statusId: string): Observable<StatusWithRepliesResponse> {
        return this.httpClient.get<StatusWithRepliesResponse>(
            `${this.baseUrl}${this.ENDPOINTS.PUBLICSTATUS}${statusId}`
        );
    }

    fetchUserFeed(page: number = 0): Observable<FeedResponse> {
        return this.httpClient.post<FeedResponse>(`${this.baseUrl}/api/users/feed?page=${page}`, {});
    }

    createStatus(request: CreateStatusRequest, mediaFiles?: File[]): Observable<string> {
        const formData = new FormData();
        formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
        if (mediaFiles?.length) {
            mediaFiles.forEach(file => formData.append('media', file, file.name));
        }
        return this.httpClient.post<string>(`${this.baseUrl}${this.ENDPOINTS.STATUS}`, formData);
    }

    deleteStatus(statusId: string): Observable<void> {
        return this.httpClient.delete<void>(`${this.baseUrl}${this.ENDPOINTS.STATUS}/${statusId}`);
    }
}
