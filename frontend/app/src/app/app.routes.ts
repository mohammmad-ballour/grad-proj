import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { FeedComponent } from './components/feed/feed.component';
import { ProfileComponent } from './components/profile/profile.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { MessagesComponent } from './components/messages/messages.component';
import { MoreComponent } from './components/more/more.component';
import { LayoutComponent } from './components/layout/layout.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { AppRoutes } from './config/app-routes.enum';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: '', redirectTo: AppRoutes.LOGIN, pathMatch: 'full' },
    {
        path: '',
        component: LayoutComponent,
        children: [
            { path: AppRoutes.HOME, component: FeedComponent },
            { path: 'explore', component: FeedComponent },
            { path: AppRoutes.NOTIFICATIONS, component: NotificationsComponent },
            { path: AppRoutes.MESSAGES, component: MessagesComponent },
            { path: AppRoutes.MORE, component: MoreComponent },
            // ⚠️ This must be **last** so it doesn't catch other static routes!
            { path: ':username', component: ProfileComponent },
        ],
        canActivate: [AuthGuard]
    },
    { path: '**', redirectTo: '' }
];
