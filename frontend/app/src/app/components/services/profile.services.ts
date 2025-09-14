import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from '../../core/services/base.service';
import { catchError, Observable, of, tap } from 'rxjs';
import { ProfileResponseDto } from '../models/ProfileResponseDto';
import { AuthService } from '../../core/services/auth.service';


@Injectable({ providedIn: 'root' })
export class ProfileServices extends BaseService {

    private readonly API_ENDPOINTS_Profile_GET = "/api/users/public/";
    private readonly API_ENDPOINTS_Profile_UPDATE = "/api/users/";
    // localhost:8080/api/users/username
    constructor(private httpClient: HttpClient, private authService: AuthService) {
        super();
    }


    GetDataOfProfile(username: string): Observable<ProfileResponseDto | null> {
        return this.httpClient
            .get<ProfileResponseDto>(`${this.baseUrl}${this.API_ENDPOINTS_Profile_GET}${username}`)
            .pipe(
                catchError((error) => {
                    if (error.status === 404) {
                        // Return null when 404
                        return of(null);
                    }
                    // Re-throw other errors
                    throw error;
                })
            );
    }

    UpdateDataOfProfile(FormData: FormData): Observable<void> {

        return this.httpClient.put<void>(
            `${this.baseUrl}${this.API_ENDPOINTS_Profile_UPDATE}${this.authService.UserId}`,
            FormData
        );
    }

    get userName() {
        return this.authService.UserName;
    }
    get userId() {
        return this.authService.UserId;
    }




}

