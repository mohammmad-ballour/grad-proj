
import { Injectable } from '@angular/core';
import { BaseService } from '../../../core/services/base.service';
import { HttpClient } from '@angular/common/http';
import { ChatResponse } from '../models/chat-response';
import { AuthService } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';
import { MessageResponse } from '../models/message-response';


@Injectable({ providedIn: 'root' })
export class ChatService extends BaseService {

  private readonly ENDPOINTS = {
    chats: '/api/chats/',
    OneOnOneChat: '/api/chats/one-to-one?recipientId=',
  };
  http: any;

  constructor(private httpClient: HttpClient, private authServices: AuthService) {
    super();
  }

  getAllUsers() {
    return this.httpClient.get<ChatResponse[]>(`${this.baseUrl}${this.ENDPOINTS.chats}${this.authServices.UserId}`);
  }

  createOneOnOneChat(recipientId: number): Observable<number> {
    return this.httpClient.post<number>(
      `${this.baseUrl}${this.ENDPOINTS.OneOnOneChat}${recipientId}`,
      {} // empty body
    );
  }


  getChatMessages(chatId: number): Observable<MessageResponse> {
    console.log(`${this.baseUrl}${this.ENDPOINTS.chats}${chatId}/messages`)

    return this.httpClient.get<MessageResponse>(`${this.baseUrl}${this.ENDPOINTS.chats}${chatId}/messages`)

  }

  sendMessage(chatId: number, content: string): Observable<MessageResponse> {
    const body = { content }; // matches your CreateMessage DTO
    return this.httpClient.post<MessageResponse>(
      `${this.baseUrl}/api/chats/${chatId}/sendMessage`,
      body
    );
  }


}
