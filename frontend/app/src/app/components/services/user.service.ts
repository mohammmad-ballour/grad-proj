import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BaseService} from '../../core/services/base.service';
import {Observable} from 'rxjs';
import {AuthService} from '../../core/services/auth.service';


@Injectable({ providedIn: 'root' })
export class UserService extends BaseService {

    private readonly API_ENDPOINTS_FOLLOW = "/api/users/follow/";
    private readonly API_ENDPOINTS_UNFOLLOW = "/api/users/unfollow/";

    constructor(private httpClient: HttpClient, private authService: AuthService) {
        super();
    }

  follow(userId: number): Observable<void> {
    return this.httpClient.post<void>(`${this.baseUrl}${this.API_ENDPOINTS_FOLLOW}${userId}`, {});
  }

  unfollow(userId: number): Observable<void> {
    return this.httpClient.post<void>(`${this.baseUrl}${this.API_ENDPOINTS_UNFOLLOW}${userId}`, {});
  }


}

