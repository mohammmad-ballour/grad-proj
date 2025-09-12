import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptorsFromDi()), {
    provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor,
    multi: true // "There may be multiple interceptors (multi: true)"


  },
  provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes),
  { provide: 'NG0913_DISABLE', useValue: true }// also apperar

  ]
};
