import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../../../core/services/base.service';
import { ReactToStatusRequest } from '../models/ReactToStatusRequestDto';

@Injectable({
    providedIn: 'root'
})
export class StatusReactionService extends BaseService {

    constructor(private http: HttpClient) {
        super();
    }

    likeStatus(request: ReactToStatusRequest): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}${this.ENDPOINTS.LIKE}`, request);
    }

    unlikeStatus(request: ReactToStatusRequest): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}${this.ENDPOINTS.UNLIKE}`, request);
    }
    /** NEW: bookmark (POST /api/bookmarks/{statusId}) */
    bookmarkStatus(statusId: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}${this.ENDPOINTS.BOOKMARKS}/${statusId}`, null);
    }

    /** NEW: un-bookmark (DELETE /api/bookmarks/{statusId}) */
    unbookmarkStatus(statusId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}${this.ENDPOINTS.BOOKMARKS}/${statusId}`);
    }
}
