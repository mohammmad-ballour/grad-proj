import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { Observable, of } from 'rxjs';
import { LogInRequestDto } from '../models/LogInRequestDto';
import { AppRoutes } from '../../../config/app-routes.enum';
import { Router } from '@angular/router';
import { BaseService } from '../../../core/services/base.service';

@Injectable({ providedIn: 'root' })
export class LoginService extends BaseService {

  private readonly API_ENDPOINTS_LOGIN = '/api/auth/login';

  constructor(private httpClient: HttpClient, private authService: AuthService, private router: Router) {
    super();
  }

  login(logInRequestDto: LogInRequestDto, routerLink: AppRoutes): Observable<string | null> {
    return this.httpClient.post<string>(`${this.baseUrl}${this.API_ENDPOINTS_LOGIN}`, logInRequestDto).pipe(
      tap(idToken => {
        //  Handle token storage only on successful response
        this.authService.TokenKey = idToken;
        this.router.navigate([routerLink]);
      }),
      catchError((loginError) => {
        console.log(loginError);
        return of(null);
      })
    );
  }

}

