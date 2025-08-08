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
    this.authService.TokenKey = null;
    return this.httpClient.post(`${this.baseUrl}${this.API_ENDPOINTS_LOGIN}`, logInRequestDto, {
      responseType: 'text'  // <-- expects plain text response (i.e. the id token)
    }).pipe(
      tap((token: string) => {
        this.authService.TokenKey = token;
        this.router.navigate([routerLink == AppRoutes.PROFILE ? this.authService.UserName : routerLink]);
      }),
      catchError((error) => {
        return of(null);
      })
    );
  }

}

