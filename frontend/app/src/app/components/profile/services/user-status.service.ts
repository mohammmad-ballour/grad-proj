import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../../../core/services/base.service';
import { StatusResponse } from '../../feed/models/StatusWithRepliesResponseDto';
import { StatusMediaResponse } from '../models/StatusMediaResponse';

@Injectable({
    providedIn: 'root'
})
export class UserStatusService extends BaseService {
    constructor(private http: HttpClient) {
        super();
    }

    fetchUserPosts(profileOwnerId: number, page: number = 0): Observable<StatusResponse[]> {
        return this.http.get<StatusResponse[]>(
            `${this.baseUrl}${this.ENDPOINTS.USERS}${profileOwnerId}/posts?page=${page}`,
            {}
        );
    }

    fetchUserReplies(profileOwnerId: number, page: number = 0): Observable<StatusResponse[]> {
        return this.http.get<StatusResponse[]>(
            `${this.baseUrl}${this.ENDPOINTS.USERS}${profileOwnerId}/replies?page=${page}`,
            {}
        );
    }

    fetchUserMedia(profileOwnerId: number, page: number = 0): Observable<StatusMediaResponse[]> {
        return this.http.get<StatusMediaResponse[]>(
            `${this.baseUrl}${this.ENDPOINTS.USERS}${profileOwnerId}/media?page=${page}`,
            {}
        );
    }

    fetchStatusesLiked(page: number = 0): Observable<StatusResponse[]> {
        return this.http.get<StatusResponse[]>(
            `${this.baseUrl}${this.ENDPOINTS.USERS}likes?page=${page}`,
            {}
        );
    }
}
