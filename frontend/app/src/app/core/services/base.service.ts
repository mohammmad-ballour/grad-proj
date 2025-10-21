import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
@Injectable({ providedIn: 'root' })

export class BaseService {


  protected readonly ENDPOINTS = {
    notifications: '/api/notifications',
    chats: '/api/chats/',
    messages: '/api/messages/',
    FOLLOW: '/api/users/follow/',
    UNFOLLOW: '/api/users/unfollow/',
    BLOCK: '/api/users/block/',
    UNBLOCK: '/api/users/unblock/',
    MUTE: '/api/users/mute/',
    UNMUTE: '/api/users/unmute/',
    UPDATE_PRIORITY: '/api/users/update-priority/',
    USERS: '/api/users/',
    PUBLICSTATUS: '/api/status/public/',
    STATUS: '/api/status',
    REPLYSTATUS: '/api/status/{statusId}/replies',
    LIKE: '/api/like',
    UNLIKE: '/api/unlike',
    Media: '/media/',
    BOOKMARKS: '/api/bookmarks', // base path

  };

  protected readonly baseUrl = environment.apiBaseUrl;
}
