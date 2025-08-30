import { Component, ElementRef, HostListener, QueryList, signal, ViewChildren, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBar } from '@angular/material/snack-bar';

import { ChatService } from '../../services/chat.service';
import { ChatResponse } from '../../models/chat-response';
import { UserResponse } from '../../models/user-response';
import { MessageResponse, MessageStatus } from '../../models/message-response';
import { MessageDetailResponse } from '../../models/message-detail-response';

@Component({
  selector: 'app-chat-list',
  templateUrl: 'chat-list.component.html',
  styleUrls: ['chat-list.component.css'],
  imports: [DatePipe, FormsModule, CommonModule, MatMenuModule, MatIconModule],
  standalone: true
})
export class ChatListComponent {

  // 🔹 Properties & Signals
  msgMenu = 'msgMenu_';
  searchTerm: any;
  selectedFile?: File;
  filePreviewUrl?: string;
  activeUserId!: number;
  messageToSent: string = '';

  // Signals
  chats = signal<ChatResponse[]>([]);
  contacts = signal<UserResponse[]>([]);
  searchNewContact = signal(false);
  chatSelected = signal<ChatResponse>({} as ChatResponse);
  messagesToSelectedChatt = signal<MessageResponse[]>([]);
  replyingToMessage = signal<MessageResponse | null>(null);

  // View references
  @ViewChildren('messageElement') messageElements!: QueryList<ElementRef>;
  @ViewChild('t') menuTrigger!: MatMenuTrigger;

  // Context menu state
  contextMenuVisible = false;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuChat!: ChatResponse;

  // Message info
  messageInfoData: MessageDetailResponse | null = null;
  deliveredKeys: string[] = [];
  readKeys: string[] = [];
  selectedMessageForMenu!: MessageResponse;

  MessageStatus = MessageStatus;

  constructor(
    private chatService: ChatService,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar
  ) { }

  // 🔹 Lifecycle hooks
  ngOnInit() {
    this.chatService.getAllUsers().subscribe({
      next: (res) => {
        const chatId = this.activatedRoute.snapshot.paramMap.get('chatId');
        if (chatId) {
          const chat = res.find(c => c.chatId === chatId);
          if (chat) this.chatClicked(chat);
        }
        this.chats.set(res);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Backend returned code:', err.status, 'Error body:', err.error);
      }
    });

    this.activeUserId = this.chatService.ActiveUserId;
  }

  ngAfterViewInit() {
    this.scrollToUnreadOrBottom();
    this.messageElements.changes.subscribe(() => this.scrollToUnreadOrBottom());
  }

  // 🔹 Chat handling
  chatClicked(chat: ChatResponse) {
    history.replaceState(null, '', `/chats/${chat.chatId}`);
    this.chatSelected.set(chat);
    this.replyingToMessage.set(null);
    this.getMessagesToSelectedChatt();

    if (chat.unreadCount > 0) this.onOpenChat(chat.chatId);
  }

  getMessagesToSelectedChatt() {
    this.chatService.getChatMessages(this.chatSelected().chatId).subscribe({
      next: (messages) => this.messagesToSelectedChatt.set(messages),
      error: (err) => console.error('Error fetching messages', err)
    });
  }

  onOpenChat(chatId: string) {
    this.chatService.confirmRead(chatId).subscribe({
      next: () => this.chatSelected().unreadCount = 0,
      error: (err) => console.error('Failed to confirm read', err)
    });
  }

  deleteChat(chatId: string) {
    this.chatService.deleteConversation(chatId).subscribe({
      next: () => {
        this.chats().splice(this.chats().findIndex(c => c.chatId === chatId), 1);
        if (this.chatSelected().chatId === chatId) {
          this.chatSelected.set({} as ChatResponse);
          this.messagesToSelectedChatt.set([]);
        }
      },
      error: (err) => console.error('Failed to delete chat', err)
    });
  }

  togglePinChat(chat: ChatResponse) {
    const request$ = chat.pinned
      ? this.chatService.UnPinConversation(chat.chatId)
      : this.chatService.pinConversation(chat.chatId);

    request$.subscribe({
      next: () => { chat.pinned = !chat.pinned; this.closeContextMenu(); },
      error: (err) => console.error(err)
    });
  }

  toggleMuteChat(chat: ChatResponse) {
    const request$ = chat.muted
      ? this.chatService.UnMuteConversation(chat.chatId)
      : this.chatService.MuteConversation(chat.chatId);

    request$.subscribe({
      next: () => { chat.muted = !chat.muted; this.closeContextMenu(); },
      error: (err) => console.error(err)
    });
  }

  // 🔹 Messages
  sendMessage(): void {
    if ((!this.messageToSent.trim() && !this.selectedFile) || !this.isChatSelected()) return;

    const parentMessageId = this.replyingToMessage()?.messageId
      ? +this.replyingToMessage()!.messageId
      : undefined;

    this.chatService
      .sendMessage(this.chatSelected().chatId, this.messageToSent, this.selectedFile, parentMessageId)
      .subscribe({
        next: () => {
          this.messageToSent = '';
          this.removeAttachment();
          const textarea = document.querySelector<HTMLTextAreaElement>('textarea');
          if (textarea) textarea.style.height = 'auto';
          this.replyingToMessage.set(null);
          this.getMessagesToSelectedChatt();
        },
        error: (err) => console.error('Error sending message', err),
      });
  }

  startReply(message?: MessageResponse): void {
    if (!message) return;
    this.replyingToMessage.set({
      ...message,
      content: message.content?.substring(0, 40) || ''
    });
  }

  cancelReply(): void {
    this.replyingToMessage.set(null);
    this.messageToSent = '';
  }

  getTheParentMesaage(messageId: number): MessageResponse {
    return this.messagesToSelectedChatt().find((m) => m.messageId == messageId) as MessageResponse;
  }

  getParentMessageContent(parentMessageId: number | undefined): string {
    if (!parentMessageId) return 'Message not found';
    const parentMessage = this.messagesToSelectedChatt().find(m => m.messageId === parentMessageId);
    return parentMessage?.content || 'Message not found';
  }

  scrollToParentMessage(parentMessageId: number): void {
    const parentElement = this.messageElements
      .toArray()
      .find(el => el.nativeElement.getAttribute('data-message-id') === parentMessageId.toString());

    if (parentElement) {
      parentElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      parentElement.nativeElement.classList.add('highlight-parent');
      setTimeout(() => parentElement.nativeElement.classList.remove('highlight-parent'), 800);
    }
  }

  // 🔹 File handling
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const maxSize = 25 * 1024 * 1024;
      if (file.size > maxSize) {
        this.snackBar.open('File size must be less than 25 MB.', 'Close', { duration: 6000 });
        return;
      }
      this.selectedFile = file;
      if (this.isImage(file)) {
        const reader = new FileReader();
        reader.onload = () => this.filePreviewUrl = reader.result as string;
        reader.readAsDataURL(file);
      } else {
        this.filePreviewUrl = undefined;
      }
    }
  }

  isImage(file: File): boolean { return file.type.startsWith('image/'); }
  isVideo(file: File): boolean { return file.type.startsWith('video/'); }
  removeAttachment(): void { this.selectedFile = undefined; this.filePreviewUrl = undefined; }

  // 🔹 Context Menu
  openContextMenu(event: MouseEvent, chat: ChatResponse) {
    event.preventDefault();
    this.contextMenuChat = chat;
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.contextMenuVisible = true;
  }

  closeContextMenu() { this.contextMenuVisible = false; }

  // 🔹 Helpers
  processImage(image: string): string { return `data:image/png;base64,${image}`; }
  processVideo(media: string): string { return media ? `data:video/mp4;base64,${media}` : ''; }

  isChatSelected(): boolean {
    const chat = this.chatSelected();
    return chat && Object.keys(chat).length > 0;
  }

  isLastFromSender(index: number): boolean {
    const msgs = this.messagesToSelectedChatt();
    const current = msgs[index];
    const next = msgs[index + 1];
    return !next || next.senderAvatar.userId !== current.senderAvatar.userId;
  }

  wrapMessage(lastMessage: string | undefined): string {
    if (lastMessage && lastMessage.length <= 20) return lastMessage;
    return lastMessage ? lastMessage.substring(0, 17) + '...' : '';
  }

  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  private scrollToUnreadOrBottom() {
    const unreadCount = this.chatSelected().unreadCount;
    const messages = this.messageElements.toArray();
    if (!messages.length) return;

    if (unreadCount > 0) {
      const firstUnreadIndex = Math.max(messages.length - unreadCount, 0);
      messages[firstUnreadIndex]?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      messages[messages.length - 1].nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }

  // 🔹 Clipboard / actions
  copy(m: any) {
    if (!m) return;
    navigator.clipboard.writeText(m).then(() => console.log('Text copied')).catch(err => console.error('Copy failed:', err));
  }
  forward(m: any) { }
  star(m: any) { }
  pin(m: any) { }
  deleteForMe(m: any) { }
  share(m: any) { }
  react(emoji: string) { }
  moreReactions() { }

  // 🔹 Message Info
  fetchMessageInfo(messageId: number): void {
    this.chatService.getMessageInfo(messageId).subscribe({
      next: (info: MessageDetailResponse) => {
        this.messageInfoData = info;
        this.deliveredKeys = info.deliveredByAt ? Object.keys(info.deliveredByAt) : [];
        this.readKeys = info.readByAt ? Object.keys(info.readByAt) : [];
      },
      error: (err) => {
        this.deliveredKeys = [];
        this.readKeys = [];
        this.messageInfoData = null;
        console.error("Failed to fetch message info:", err);
      }
    });
  }

  openInfoFromContext(trigger: MatMenuTrigger, infoMenu: MatMenu, message: MessageResponse) {
    this.fetchMessageInfo(message.messageId);
    const originalMenu = trigger.menu;
    trigger.closeMenu();
    trigger.menu = infoMenu;
    setTimeout(() => {
      trigger.openMenu();
      const sub = trigger.menuClosed.subscribe(() => {
        trigger.menu = originalMenu;
        sub.unsubscribe();
      });
    }, 440);
  }

  // 🔹 Sorting & Filtering
  get sortedChats() {
    return this.chats().slice().sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
  }

  get filteredChats(): ChatResponse[] {
    const term = this.searchTerm?.trim().toLowerCase();
    if (!term) return this.sortedChats;
    return this.sortedChats.filter(chat => {
      const nameMatch = chat.name?.toLowerCase().includes(term);
      const lastMsgMatch = chat.lastMessage?.toLowerCase().includes(term);
      return nameMatch || lastMsgMatch;
    });
  }

  // 🔹 Host Listeners
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.menuTrigger?.menuOpen) this.menuTrigger.closeMenu();
  }
}
