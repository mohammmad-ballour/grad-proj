import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BaseService } from '../../../core/services/base.service';
import { CreateStatusRequest, StatusWithRepliesResponse, UpdateStatusContent, UpdateStatusSettings } from '../models/StatusWithRepliesResponseDto';
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
        return this.httpClient.get<FeedResponse>(`${this.baseUrl}/api/users/feed?page=${page}`, {});
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

    updateStatusSettings(statusId: string, toUpdate: UpdateStatusSettings): Observable<void> {
        return this.httpClient.put<void>(
            `${this.baseUrl}${this.ENDPOINTS.STATUS}/${statusId}/update-audience`,
            toUpdate
        );
    }

    /** Update content + media
     *  Backend: PUT /status/{statusId}/update-content (multipart/form-data)
     *  Parts:
     *    - request (application/json): { newContent, keepMediaIds, removeMediaIds }
     *    - media (file[]) optional
     *
     *  Note: backend expects List<Long> for ids → convert string[] → number[]
     */
    updateStatusContent(
        statusId: string,
        request: UpdateStatusContent,
        newMedia?: File[]
    ): Observable<void> {
        const toLongArray = (arr?: string[]) =>
            Array.isArray(arr) ? arr.map(v => Number(v)).filter(v => Number.isFinite(v)) : undefined;

        const wirePayload = {
            newContent: request.newContent,
            keepMediaIds: toLongArray(request.keepMediaIds),
            removeMediaIds: toLongArray(request.removeMediaIds),
        };

        const form = new FormData();
        form.append('request', new Blob([JSON.stringify(wirePayload)], { type: 'application/json' }));

        if (newMedia?.length) {
            newMedia.forEach(f => form.append('media', f, f.name));
        }

        return this.httpClient.put<void>(
            `${this.baseUrl}${this.ENDPOINTS.STATUS}/${statusId}/update-content`,
            form
        );
    }
}
