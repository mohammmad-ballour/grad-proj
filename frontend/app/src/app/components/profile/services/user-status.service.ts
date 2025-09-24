import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../../../core/services/base.service';
import { StatusResponse } from '../../feed/models/StatusWithRepliesResponseDto';
import { TimestampSeekRequest } from '../../models/TimestampSeekRequestDto';
import { StatusMediaResponse } from '../models/StatusMediaResponse';



@Injectable({
    providedIn: 'root'
})
export class UserStatusService extends BaseService {

    constructor(private http: HttpClient) {
        super();
    }

    fetchUserPosts(profileOwnerId: number, seekRequest?: TimestampSeekRequest): Observable<StatusResponse[]> {
        return this.http.post<StatusResponse[]>(
            `${this.baseUrl}${this.ENDPOINTS.USERS}${profileOwnerId}/posts`,
            seekRequest ?? {}
        );
    }

    fetchUserReplies(profileOwnerId: number, seekRequest?: TimestampSeekRequest): Observable<StatusResponse[]> {
        return this.http.post<StatusResponse[]>(
            `${this.baseUrl}${this.ENDPOINTS.USERS}${profileOwnerId}/replies`,
            seekRequest ?? {}
        );
    }

    fetchUserMedia(profileOwnerId: number, seekRequest?: TimestampSeekRequest): Observable<StatusMediaResponse[]> {
        return this.http.post<StatusMediaResponse[]>(
            `${this.baseUrl}${this.ENDPOINTS.USERS}${profileOwnerId}/media`,
            seekRequest ?? {}
        );
    }
    fetchStatusesLiked(seekRequest?: TimestampSeekRequest): Observable<StatusResponse[]> {
        return this.http.post<StatusResponse[]>(
            `${this.baseUrl}${this.ENDPOINTS.USERS}likes`,
            {}
        );
    }
}
