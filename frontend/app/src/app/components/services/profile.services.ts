import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from '../../core/services/base.service';
import { Observable, tap } from 'rxjs';
import { ProfileResponseDto } from '../models/ProfileResponseDto';
import { ProfileRequestDto } from '../models/ProfileRequestDto';
import { AuthService } from '../../core/services/auth.service';


@Injectable({ providedIn: 'root' })
export class ProfileServices extends BaseService {

    private readonly API_ENDPOINTS_Profile_GET = "/api/users/public/";
    private readonly API_ENDPOINTS_Profile_UPDATE = "/api/users/";
    // localhost:8080/api/users/username
    constructor(private httpClient: HttpClient, private authService: AuthService) {
        super();
    }


    GetDataOfProfile(): Observable<ProfileResponseDto | null> {
        console.log(this.authService.UserId)

        return this.httpClient
            .get<ProfileResponseDto>(`${this.baseUrl}${this.API_ENDPOINTS_Profile_GET}${this.authService.UserName}`);
    }

    UpdateDataOfProfile(ProfileRequestDto: ProfileRequestDto): Observable<void> {
        console.log(this.authService.UserId)
        return this.httpClient.put<void>(
            `${this.baseUrl}${this.API_ENDPOINTS_Profile_UPDATE}${this.authService.UserId}`,
            this.CreateFormData(ProfileRequestDto)
        );
    }

    private CreateFormData(ProfileRequestDto: ProfileRequestDto): FormData {
        const formData = new FormData();

        if (ProfileRequestDto.displayName) {
            formData.append('displayName', ProfileRequestDto.displayName);
        }
        if (ProfileRequestDto.dob) {
            formData.append('dob', ProfileRequestDto.dob);
        }
        if (ProfileRequestDto.gender) {
            formData.append('gender', ProfileRequestDto.gender);
        }
        if (ProfileRequestDto.residence) {
            formData.append('residence', ProfileRequestDto.residence);
        }
        if (ProfileRequestDto.timezoneId) {
            formData.append('timezoneId', ProfileRequestDto.timezoneId);
        }
        if (ProfileRequestDto.profileBio) {
            formData.append('profileBio', ProfileRequestDto.profileBio);
        }
        if (ProfileRequestDto.profilePicture) {
            formData.append('profilePicture', ProfileRequestDto.profilePicture);
        }
        if (ProfileRequestDto.profileCoverPhoto) {
            formData.append('profileCoverPhoto', ProfileRequestDto.profileCoverPhoto);
        }

        return formData;
    }







}

