import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from '../../core/services/base.service';
import { catchError, Observable, of, tap } from 'rxjs';
import { ProfileResponseDto } from '../models/ProfileResponseDto';
import { AuthService } from '../../core/services/auth.service';
import { StatusWithRepliesResponse } from '../models/StatusWithRepliesResponseDto';


@Injectable({ providedIn: 'root' })
export class StatusServices extends BaseService {
    constructor(private httpClient: HttpClient, private authService: AuthService) {
        super();
    }
    getStatusById(statusId: string): Observable<StatusWithRepliesResponse> {
        return this.httpClient.get<StatusWithRepliesResponse>(`${this.baseUrl}${this.ENDPOINTS.STATUS}${statusId}`)

    }
}

