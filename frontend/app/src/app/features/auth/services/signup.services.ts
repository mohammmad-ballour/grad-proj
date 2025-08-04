import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError } from 'rxjs/operators';
import { LoginService } from "./login.service";
import { SignUpRequestDto } from "../models/SignUpRequestDto";
import { BaseService } from '../../../core/services/base.service';
import { Observable, of, switchMap, throwError } from 'rxjs';
import { AppRoutes } from '../../../config/app-routes.enum';

@Injectable({ providedIn: 'root' })
export class SignupService extends BaseService {
    private readonly API_ENDPOINTS_USERS = '/api/users';
    constructor(private http: HttpClient, private loginServices: LoginService) {
        super();
    }

    signup(signupRequest: SignUpRequestDto): Observable<string | null> {
        return this.http.post(`${this.baseUrl}${this.API_ENDPOINTS_USERS}`, signupRequest).pipe(
            catchError(signupError => {
                return throwError(() => signupError); // propagate to stop the flow
            }),
            switchMap(() =>
                this.loginServices.login(
                    { email: signupRequest.email, password: signupRequest.password },
                    AppRoutes.PROFILE
                ).pipe(
                    catchError(() => {
                        return of(null); // continue with null so caller can handle failure
                    })
                )
            )
        );
    }
}
