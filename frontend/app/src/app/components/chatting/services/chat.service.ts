import { Injectable } from '@angular/core';
import { BaseService } from '../../../core/services/base.service';
import { HttpClient } from '@angular/common/http';
import { ChatResponse } from '../models/chat-response';
import { AuthService } from '../../../core/services/auth.service';
import { Observable, tap } from 'rxjs';
import { MessageResponse } from '../models/message-response';
import { MessageDetailResponse } from '../models/message-detail-response';
import { UserResponse } from '../models/user-response';


@Injectable({ providedIn: 'root' })
export class ChatService extends BaseService {


  constructor(private httpClient: HttpClient, private authServices: AuthService) {
    super();
  }
  private reciveriD!: number;
  getAllChats(): Observable<ChatResponse[]> {
    return this.httpClient.get<ChatResponse[]>(`${this.baseUrl}${this.ENDPOINTS.chats}${this.authServices.UserId}/chat-list`);
  }

  createOneOnOneChat(recipientId: number): Observable<string> {
    return this.httpClient.get<string>(
      `${this.baseUrl}${this.ENDPOINTS.chats}${recipientId}`,
      { responseType: 'text' as 'json' } // important
    ).pipe(
      tap(() => {
        // Store recipientId after the call is successful
        this.reciveriD = recipientId;
      })
    );
  }

  // return this.http.post(`${this.apiUrl}/${recipientId}`, {}, { headers, responseType: 'text' });



  deleteConversation(chatId: string): Observable<void> {
    const req$ = this.httpClient.delete<void>(`${this.baseUrl}${this.ENDPOINTS.chats}${chatId}`);

    return req$;
  }

  // Pin a conversation
  pinConversation(chatId: string): Observable<void> {
    const url = `${this.baseUrl}${this.ENDPOINTS.chats}${chatId}/pin`;
    return this.httpClient.patch<void>(url, null); // no body needed
  }
  UnPinConversation(chatId: string): Observable<void> {
    const url = `${this.baseUrl}${this.ENDPOINTS.chats}${chatId}/unpin`;
    return this.httpClient.patch<void>(url, null); // no body needed
  }

  // UnMute a conversation
  MuteConversation(chatId: string): Observable<void> {
    const url = `${this.baseUrl}${this.ENDPOINTS.chats}${chatId}/mute`;
    return this.httpClient.patch<void>(url, null); // no body needed
  }
  // Mute a conversation
  UnMuteConversation(chatId: string): Observable<void> {
    const url = `${this.baseUrl}${this.ENDPOINTS.chats}${chatId}/unmute`;
    return this.httpClient.patch<void>(url, null); // no body needed
  }


  getGroupCandidates(nameToSearch: string, page: number = 0): Observable<UserResponse[]> {
    console.log('called')
    const url = `${this.baseUrl}${this.ENDPOINTS.chats}candidate-users/${encodeURIComponent(nameToSearch)}`;
    return this.httpClient.get<UserResponse[]>(url, { params: { page: page.toString() } });
  }

  createGroupChat(groupName: string, participantIds: number[], groupPicture?: File): Observable<string> {
    const formData = new FormData();

    // simple text field
    formData.append('groupName', groupName);

    // backend expects @RequestPart("users") → JSON array
    formData.append('users', new Blob([JSON.stringify(participantIds)], { type: 'application/json' }));

    // optional file
    if (groupPicture) {
      formData.append('groupPicture', groupPicture);
    }

    return this.httpClient.post(
      `${this.baseUrl}${this.ENDPOINTS.chats}group`,
      formData,
      { responseType: 'text' } // specify response type
    );
  }


}

