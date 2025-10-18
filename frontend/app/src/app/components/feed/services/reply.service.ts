// reply.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../../../core/services/base.service';
import { ReplySnippet } from '../models/StatusWithRepliesResponseDto';


interface TimestampSeekRequest {
    lastHappenedAt: string;
    lastEntityId: string;
}
@Injectable({
    providedIn: 'root'
})
export class ReplyService extends BaseService {

    constructor(private http: HttpClient) {
        super();
    }
    fetchMoreReplies(statusId: string, timestamp?: TimestampSeekRequest): Observable<ReplySnippet[]> {
        return this.http.post<ReplySnippet[]>(
            `${this.baseUrl}${this.ENDPOINTS.REPLYSTATUS.replace('{statusId}', statusId.toString())}`,
            timestamp,
        );
    }



}
