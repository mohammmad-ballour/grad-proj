import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { FeedComponent } from './components/feed/feed.component';
import { ProfileComponent } from './components/profile/profile.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { MoreComponent } from './components/more/more.component';
import { LayoutComponent } from './components/layout/layout.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { AppRoutes } from './config/app-routes.enum';
import { AuthGuard } from './core/guards/auth.guard';
import { LogoutComponent } from './features/auth/logout/logout.component';
import { ChatListComponent } from './components/chatting/components/chat-list/chat-list.component';

export const routes: Routes = [
    { path: AppRoutes.LOGIN, component: LoginComponent },
    { path: AppRoutes.LOGOUT, component: LogoutComponent },
    { path: AppRoutes.SIGNUP, component: SignupComponent },
    { path: '', redirectTo: AppRoutes.LOGIN, pathMatch: 'full' },
    {
        path: '',
        component: LayoutComponent,
        children: [
            { path: AppRoutes.HOME, component: FeedComponent },
            { path: 'explore', component: FeedComponent },
            { path: AppRoutes.NOTIFICATIONS, component: NotificationsComponent },
            { path: AppRoutes.MESSAGES, component: ChatListComponent },
            { path: AppRoutes.MORE, component: MoreComponent },
            // ⚠️ This must be **last** so it doesn't catch other static routes!
            { path: `${AppRoutes.MESSAGES}/:chatId`, component: ChatListComponent },//is not work

            { path: ':username', component: ProfileComponent },
        ],
        canActivate: [AuthGuard]
    },
    { path: '**', redirectTo: '' }
];
