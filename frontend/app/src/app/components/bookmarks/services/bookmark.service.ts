import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../../../core/services/base.service';
import { StatusResponse } from '../../feed/models/StatusWithRepliesResponseDto';

@Injectable({ providedIn: 'root' })
export class BookmarkService extends BaseService {

    constructor(private http: HttpClient) { super(); }

    /** GET /api/bookmarks?page=0 */
    list(page = 0): Observable<StatusResponse[]> {
        const params = new HttpParams().set('page', page.toString());
        return this.http.get<StatusResponse[]>(`${this.baseUrl}${this.ENDPOINTS.BOOKMARKS}`, { params });
    }
}
