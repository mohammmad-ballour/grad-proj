import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { FeedComponent } from './components/feed/feed.component';
import { ProfileComponent } from './components/profile/profile.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { LayoutComponent } from './components/layout/layout.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { AppRoutes } from './config/app-routes.enum';
import { AuthGuard } from './core/guards/auth.guard';
import { LogoutComponent } from './features/auth/logout/logout.component';
import { ChatComponent } from './components/chatting/components/chat/chat.component';
import { StatusDetailComponent } from './components/feed/status-detail/status-detail.component';
import { BookmarksComponent } from './components/bookmarks/bookmarks.component';

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
            { path: AppRoutes.BOOKMARKS, component: BookmarksComponent },
            { path: AppRoutes.NOTIFICATIONS, component: NotificationsComponent },
            { path: AppRoutes.MESSAGES, component: ChatComponent },
            // there is conflect
            // ⚠️ This must be **last** so it doesn't catch other static routes!
            { path: `${AppRoutes.MESSAGES}/:chatId`, component: ChatComponent },
            { path: `${AppRoutes.STATUS}/:statusId`, component: FeedComponent },

            { path: ':username', component: ProfileComponent },
        ],
        canActivate: [AuthGuard]
    },
    { path: '**', redirectTo: '' }
];
