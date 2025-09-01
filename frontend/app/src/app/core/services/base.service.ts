import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
@Injectable({ providedIn: 'root' })

export class BaseService {


  protected readonly ENDPOINTS = {
    chats: '/api/chats/',
    messages: '/api/messages/',
  };

  protected readonly baseUrl = environment.apiBaseUrl;
}
