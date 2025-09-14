import { Component, HostListener, signal, TemplateRef, Signal } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { ChatResponse } from '../../models/chat-response';
import { CommonModule, DatePipe } from '@angular/common';
import { UserResponse } from '../../models/user-response';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageResponse } from '../../models/message-response';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from "@angular/material/icon";
import { ViewChild } from '@angular/core';
import { MessageDetailResponse } from '../../models/message-detail-response';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { AppRoutes } from '../../../../config/app-routes.enum';
import { MessageService } from '../../services/message.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ChatMessagesComponent } from "../chat-messages/chat-messages.component";
import { ChatListComponent } from "../chat-list/chat-list.component";
@Component({
  selector: 'app-chat',
  imports: [FormsModule, CommonModule, MatMenuModule, MatIconModule, MatDialogModule, MatInputModule, ChatMessagesComponent, ChatListComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})

export class ChatComponent {
  chatSelected = signal<ChatResponse>({} as ChatResponse);
  activeUserId!: number;
  constructor(
    private authService: AuthService,
  ) { }
  ngOnInit() {
    this.activeUserId = this.authService.UserId
  }
  isChatSelected(): boolean {
    const chat = this.chatSelected();
    return chat && Object.keys(chat).length > 0;
  }
  onChatSelected(chat: ChatResponse) {
    this.chatSelected.set(chat);   // store selected chat
    console.log("Parent received chat:", chat);
  }
}