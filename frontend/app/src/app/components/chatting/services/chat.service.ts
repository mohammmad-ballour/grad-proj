
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

  };
  http: any;

  constructor(private httpClient: HttpClient, private authServices: AuthService) {
    super();
  }

  getAllUsers() {
    return this.httpClient.get<ChatResponse[]>(`${this.baseUrl}${this.ENDPOINTS.chats}${this.authServices.UserId}/chat-list`);
  }
  createOneOnOneChat(recipientId: number): Observable<number> {
    return this.httpClient.get<number>(
      `${this.baseUrl}${this.ENDPOINTS.chats}${recipientId}`,
      {}
    );
  }

  get ActiveUserId() {
    return this.authServices.UserId;
  }

  getChatMessages(chatId: number): Observable<MessageResponse[]> {


    return this.httpClient.get<MessageResponse[]>(`${this.baseUrl}${this.ENDPOINTS.chats}${chatId}/chat-messages`,)

  }

  sendMessage(
    chatId: number,
    content: string,
    file?: File,
    parentMessageId?: number
  ): Observable<MessageResponse> {
    const formData = new FormData();

    // JSON part ("request")
    const request = { content };
    formData.append(
      "request",
      new Blob([JSON.stringify(request)], { type: "application/json" })
    );

    // File part
    if (file) {
      formData.append("attachment", file);
    }

    // Append parentMessageId as query param if present
    let url = `${this.baseUrl}/api/chats/${chatId}/sendMessage`;
    if (parentMessageId) {
      url += `?parentMessageId=${parentMessageId}`;
    }

    return this.httpClient.post<MessageResponse>(url, formData);
  }




  confirmRead(chatId: number) {
    return this.httpClient.post<void>(`${this.baseUrl}${this.ENDPOINTS.chats}${chatId}/confirmRead`, {});
  }



}
