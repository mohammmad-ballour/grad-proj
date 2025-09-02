import { Component, HostListener, signal, Output, EventEmitter, ViewChild, TemplateRef, } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { ChatResponse } from '../../models/chat-response';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from "@angular/material/icon";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { MessageService } from '../../services/message.service';
import { AppRoutes } from '../../../../config/app-routes.enum';
import { UserResponse } from '../../models/user-response';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-chat-list',
  templateUrl: 'chat-list.component.html',
  styleUrls: ['chat-list.component.css'],
  imports: [
    DatePipe,
    FormsModule,
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule
  ],
  standalone: true
})
export class ChatListComponent {
  groupSearchTerm: string = '';
  groupName: any;
  selectedFile?: File;

  participantIds = signal<number[]>([]);
  isGroupMode = false;
  contacts = signal<UserResponse[]>([]);
  searchTerm = '';
  chats = signal<ChatResponse[]>([]);
  selectedChat = signal<ChatResponse | null>(null);   // 🔹 new internal state
  loadingChats = signal(false);

  @Output() chatSelected = new EventEmitter<ChatResponse>();

  @ViewChild('t') menuTrigger!: MatMenuTrigger;

  constructor(
    private chatService: ChatService,
    private messageService: MessageService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar,

  ) { }

  ngOnInit() {
    this.loadingChats.set(false);

    this.chatService.getAllChats().subscribe({
      next: (res) => {
        this.chats.set(res);
        const chatId = this.activatedRoute.snapshot.paramMap.get('chatId');
        if (chatId) {
          const chat = res.find(c => c.chatId === chatId);
          if (chat) {
            this.chatClicked(chat);
          }
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Backend returned code:', err.status, 'body:', err.error);
      },
      complete: () => this.loadingChats.set(true)
    });
  }

  // --- UI Helpers ---
  wrapMessage(lastMessage: string | undefined): string {
    if (!lastMessage) return '';
    return lastMessage.length <= 20 ? lastMessage : lastMessage.substring(0, 17) + '...';
  }

  processImage(image: string): string {
    return `data:image/png;base64,${image}`;
  }

  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }

  isChatSelected(): boolean {
    return !!this.selectedChat();
  }

  // --- Chat Actions ---
  chatClicked(chat: ChatResponse) {
    history.replaceState(null, '', `/chats/${chat.chatId}`);
    this.selectedChat.set(chat);
    this.chatSelected.emit(chat);

    if (chat.unreadCount > 0) {
      this.onOpenChat(chat.chatId);
    }
  }

  onOpenChat(chatId: string) {
    this.messageService.confirmRead(chatId).subscribe({
      next: () => {
        this.selectedChat.update(c =>
          c && c.chatId === chatId ? { ...c, unreadCount: 0 } : c
        );
      },
      error: (err) => console.error('Failed to confirm read', err)
    });
  }

  deleteChat(chatId: string) {
    this.chats.update(chats => chats.filter(c => c.chatId !== chatId));

    const deletedChats: string[] = JSON.parse(localStorage.getItem('deletedChats') || '[]');
    if (!deletedChats.includes(chatId)) {
      deletedChats.push(chatId);
      localStorage.setItem('deletedChats', JSON.stringify(deletedChats));
    }
  }

  togglePinChat(chat: ChatResponse) {
    const request$ = chat.pinned
      ? this.chatService.UnPinConversation(chat.chatId)
      : this.chatService.pinConversation(chat.chatId);

    request$.subscribe({
      next: () => {
        this.chats.update(chats =>
          chats.map(c => c.chatId === chat.chatId ? { ...c, pinned: !c.pinned } : c)
        );
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
        this.chats.update(chats =>
          chats.map(c => c.chatId === chat.chatId ? { ...c, muted: !c.muted } : c)
        );
        this.closeContextMenu();
      },
      error: (err) => console.error(err)
    });
  }

  // --- Sorting & Filtering ---
  get sortedChats(): ChatResponse[] {
    return [...this.chats()].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
  }

  get filteredChats(): ChatResponse[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.sortedChats;

    return this.sortedChats.filter(chat =>
      chat.name?.toLowerCase().includes(term) ||
      chat.lastMessage?.toLowerCase().includes(term)
    );
  }

  // --- Context Menu ---
  contextMenuVisible = false;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuChat!: ChatResponse;

  openContextMenu(event: MouseEvent, chat: ChatResponse) {
    event.preventDefault();
    this.contextMenuChat = chat;
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.contextMenuVisible = true;
  }

  closeContextMenu() {
    this.contextMenuVisible = false;
  }

  // --- Host Listener ---
  @HostListener('document:click', ['$event'])
  onDocumentClick() {
    if (this.menuTrigger?.menuOpen) {
      this.menuTrigger.closeMenu();
    }
  }


  createGroupChat() {
    this.participantIds.set(
      this.contacts().filter(c => !c.canBeAddedToGroupByCurrentUser).map(c => c.userAvatar.userId)
    );
    console.log(this.selectedFile)
    console.log(this.participantIds())
    this.chatService.createGroupChat(this.groupName, this.participantIds(), this.selectedFile)
      .subscribe({
        next: (res: string) => {

          console.log('Group created with ID:', res)
          this.router.navigate([`${AppRoutes.MESSAGES}`, res]);
          this.ngOnInit();
        },
        error: err => console.error(err)
      });
  }


  groupAvatarPreview: string | null = null;



  onGroupAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = e => this.groupAvatarPreview = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }


  openChat(userId: number): void {
    this.chatService.createOneOnOneChat(userId).subscribe({
      next: (chatId: string) => {
        // Close any open dialogs (the new-chat dialog) then navigate to the chat
        this.closeDialog();
        this.router.navigate([`${AppRoutes.MESSAGES}`, chatId]);
        this.ngOnInit();
      },
      error: (err) => {
        this.snackBar.open('Failed to open chat. Please try again later.');
      }
    });
  }

  closeDialog() {
    this.dialog.closeAll();
  }

  getGroupCandidates(): void {
    this.chatService.getGroupCandidates(this.groupSearchTerm).subscribe({
      next: (res: UserResponse[]) => {

        const filterdRes = this.isGroupMode ? res.filter(u => u.canBeAddedToGroupByCurrentUser) : res.filter(u => u.canBeMessagedByCurrentUser)
        this.contacts.set(filterdRes);
        console.log('Group candidates:', res);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to load group candidates', err);
        this.snackBar.open('Failed to load users for group', 'Close', { duration: 4000 });
      }
    });
  }

  openNewChatDialog(templateRef: TemplateRef<any>, isGroupMode: boolean): void {
    if (!this.dialog) {
      console.error('Dialog service not available');
      return;
    }
    this.isGroupMode = isGroupMode;
    this.groupSearchTerm = '';
    this.contacts.set([]);
    this.dialog.open(templateRef);
  }

}
