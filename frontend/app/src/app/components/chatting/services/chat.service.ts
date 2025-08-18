
import { Injectable } from '@angular/core';
import { BaseService } from '../../../core/services/base.service';
import { HttpClient } from '@angular/common/http';
import { ChatResponse } from '../models/chat-response';
import { AuthService } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class ChatService extends BaseService {

  private readonly ENDPOINTS = {
    chats: '/api/chats/',
    OneOnOneChat: '/api/chats/one-to-one?'
  };
  http: any;

  constructor(private httpClient: HttpClient, private authServices: AuthService) {
    super();
  }



  getAllUsers() {
    return this.httpClient.get<ChatResponse[]>(`${this.baseUrl}${this.ENDPOINTS.chats}${this.authServices.UserId}`);
  }




  private apiUrl = 'http://localhost:8080/api'; // adjust to your backend URL


  createOneOnOneChat(recipientId: number): Observable<number> {
    return this.httpClient.post<number>(
      `${this.apiUrl}/chats/one-to-one?recipientId=${recipientId}`,
      {} // empty body
    );
  }


}
