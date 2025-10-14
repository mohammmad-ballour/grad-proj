import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
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
        return this.httpClient.get<StatusWithRepliesResponse>(`${this.baseUrl}${this.ENDPOINTS.PUBLICSTATUS}${statusId}`)

    }

    fetchUserFeed(page: number = 0): Observable<FeedResponse> {
        return this.httpClient.post<FeedResponse>(`${this.baseUrl}/api/users/feed?page=${page}`, {});
    }

    createStatus(request: CreateStatusRequest, mediaFiles: File[]): Observable<string> {
        console.log(request);
        const formData = new FormData();

        // ✅ append JSON request as a JSON blob
        formData.append(
            'request',
            new Blob([JSON.stringify(request)], { type: 'application/json' })
        );

        // append media files
        if (mediaFiles && mediaFiles.length > 0) {
            mediaFiles.forEach(file => {
                formData.append('media', file, file.name);
            });
        }

        for (const [key, value] of formData.entries()) {
            console.log(key, value);
        }

        return this.httpClient.post<string>(`${this.baseUrl}${this.ENDPOINTS.STATUS}`, formData, {

        });
    }


}

