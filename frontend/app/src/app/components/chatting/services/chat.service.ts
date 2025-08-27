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

  getAllUsers(): Observable<ChatResponse[]> {
    return this.httpClient.get<ChatResponse[]>(`${this.baseUrl}${this.ENDPOINTS.chats}${this.authServices.UserId}/chat-list`);
  }

  createOneOnOneChat(recipientId: number): Observable<string> {
    return this.httpClient.get(`${this.baseUrl}${this.ENDPOINTS.chats}${recipientId}`, {
      responseType: 'text'
    });
  }


  get ActiveUserId(): number {
    return this.authServices.UserId;
  }

  getChatMessages(chatId: string): Observable<MessageResponse[]> {
    return this.httpClient.get<MessageResponse[]>(`${this.baseUrl}${this.ENDPOINTS.chats}${chatId}/chat-messages`,)
  }
  deleteConversation(chatId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}${this.ENDPOINTS.chats}${chatId}`);
  }
  sendMessage(
    chatId: string,
    content: string,
    file?: File,
    parentMessageId?: number
  ): Observable<number> {
    const formData = new FormData();

    // JSON part ("request")
    const request = { content };
    formData.append(
      "request",
      new Blob([JSON.stringify(request)], { type: "application/json" })
    );

    // File part (optional)
    if (file) {
      formData.append("attachment", file);
    }

    // Append parentMessageId as query param (only if defined, including 0)
    let url = `${this.baseUrl}${this.ENDPOINTS.chats}${chatId}/sendMessage`;
    if (parentMessageId !== undefined && parentMessageId !== null) {
      url += `?parentMessageId=${parentMessageId}`;
    }

    return this.httpClient.post<number>(url, formData);
  }




  confirmRead(chatId: string) {
    return this.httpClient.post<void>(`${this.baseUrl}${this.ENDPOINTS.chats}${chatId}/confirmRead`, {});
  }

  // Pin a conversation
  pinConversation(chatId: string): Observable<void> {
    const url = `${this.baseUrl}${this.ENDPOINTS.chats}${chatId}/pin`;
    return this.httpClient.patch<void>(url, null); // no body needed
  }

  // Mute a conversation
  muteConversation(chatId: string): Observable<void> {
    const url = `${this.baseUrl}${this.ENDPOINTS.chats}${chatId}/mute`;
    return this.httpClient.patch<void>(url, null); // no body needed
  }

}
