import { Component, ElementRef, HostListener, QueryList, signal, ViewChildren, TemplateRef, Signal } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { ChatResponse } from '../../models/chat-response';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from "@angular/material/icon";
import { ViewChild } from '@angular/core';
import { MatDialogModule } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-chat-list',
  templateUrl: 'chat-list.component.html',
  styleUrls: ['chat-list.component.css'],
  imports: [DatePipe, FormsModule, CommonModule, MatMenuModule, MatIconModule, MatDialogModule, MatInputModule],
  standalone: true
})
export class ChatListComponent {
  searchTerm: string = '';
  participantIds = signal<number[]>([]);
  chats = signal<ChatResponse[]>([]);
  chatSelected = signal<ChatResponse>({} as ChatResponse);
  loadingChats = signal(false);


  constructor(
    private chatService: ChatService,
    private messageService: MessageService,
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.loadingChats.set(false);
    this.chatService.getAllChats().subscribe({
      next: (res) => {
        const chatId = this.activatedRoute.snapshot.paramMap.get('chatId');
        if (chatId) {
          console.log("chatId:", chatId);
          const chat = res.find(c => c.chatId === chatId);
          console.log("chat found:", chat);
          if (chat) {
            this.chatClicked(chat);
          }
        }
        this.chats.set(res);
        console.log(this.chats())
      },
      error: (err: HttpErrorResponse) => {
        console.error('Backend returned code:', err.status);
        console.error('Error body:', err.error);
        this.loadingChats.set(true);
      },
      complete: () => {

        this.loadingChats.set(true);
      }

    });

  }

  wrapMessage(lastMessage: string | undefined): string {
    if (lastMessage && lastMessage.length <= 20) return lastMessage;
    return lastMessage ? lastMessage.substring(0, 17) + '...' : '';
  }

  chatClicked(chat: ChatResponse) {
    history.replaceState(null, '', `/chats/${chat.chatId}`);
    this.chatSelected.set(chat);
    if (chat.unreadCount > 0) {
      this.onOpenChat(chat.chatId);
    }
  }

  onOpenChat(chatId: string) {
    this.messageService.confirmRead(chatId).subscribe({
      next: () => this.chatSelected().unreadCount = 0,
      error: (err) => console.error('Failed to confirm read', err)
    });
  }

  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }

  processImage(image: string): string {
    return `data:image/png;base64,${image}`;
  }

  isChatSelected(): boolean {
    const chat = this.chatSelected();
    return chat && Object.keys(chat).length > 0;
  }
  @ViewChild('t') menuTrigger!: MatMenuTrigger;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close menu if click is outside the open menu
    if (this.menuTrigger?.menuOpen) {
      this.menuTrigger.closeMenu();
    }
  }

  selectedFile?: File;
  filePreviewUrl?: string;
  contextMenuVisible = false;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuChat!: ChatResponse; // chat object for which menu opened
  // Open context menu
  openContextMenu(event: MouseEvent, chat: ChatResponse) {
    event.preventDefault(); // prevent default browser menu
    this.contextMenuChat = chat;
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.contextMenuVisible = true;
  }

  // Close menu when clicking outside
  closeContextMenu() {
    this.contextMenuVisible = false;
  }

  togglePinChat(chat: ChatResponse) {
    const request$ = chat.pinned
      ? this.chatService.UnPinConversation(chat.chatId)
      : this.chatService.pinConversation(chat.chatId);

    request$.subscribe({
      next: () => {
        chat.pinned = !chat.pinned;
        this.closeContextMenu();
      },
      error: (err) => console.error(err)
    });
  }

  toggleMuteChat(chat: ChatResponse) {
    const request$ = chat.muted
      ? this.chatService.UnMuteConversation(chat.chatId)
      : this.chatService.MuteConversation(chat.chatId);

    request$.subscribe({
      next: () => {
        chat.muted = !chat.muted;
        this.closeContextMenu();
      },
      error: (err) => console.error(err)
    });
  }
  get sortedChats() {
    return this.chats().slice().sort((a, b) => {
      // 1️⃣ Pinned first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // 2️⃣ Sort by lastMessageTime (fallback: 0 if undefined)
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;

      return timeB - timeA;
    });
  }

  deleteChat(chatId: string) {
    // remove from chats
    const index = this.chats().findIndex(c => c.chatId === chatId);
    if (index !== -1) {
      this.chats().splice(index, 1);
    }

    // get deleted chats from localStorage (or empty array if none yet)
    const deletedChats: string[] = JSON.parse(localStorage.getItem('deletedChats') || '[]');

    // add the new deleted chatId if not already stored
    if (!deletedChats.includes(chatId)) {
      deletedChats.push(chatId);
      localStorage.setItem('deletedChats', JSON.stringify(deletedChats));
    }
  }
  get filteredChats(): ChatResponse[] {
    const term = this.searchTerm?.trim().toLowerCase();

    if (!term) {
      return this.sortedChats;
    }

    return this.sortedChats.filter(chat => {
      const nameMatch = chat.name?.toLowerCase().includes(term);
      const lastMsgMatch = chat.lastMessage?.toLowerCase().includes(term);
      return nameMatch || lastMsgMatch;
    });
  }

}
