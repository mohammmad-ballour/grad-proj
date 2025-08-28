import { Component, ElementRef, HostListener, QueryList, signal, ViewChildren } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { ChatResponse } from '../../models/chat-response';
import { CommonModule, DatePipe } from '@angular/common';
import { UserResponse } from '../../models/user-response';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageResponse, MessageStatus } from '../../models/message-response';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from "@angular/material/icon";
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-chat-list',
  templateUrl: 'chat-list.component.html',
  styleUrls: ['chat-list.component.css'],
  imports: [DatePipe, FormsModule, CommonModule, MatMenuModule, MatIconModule],
  standalone: true
})
export class ChatListComponent {

  msgMenu = 'msgMenu_';
  searchTerm: any;
  selectMessage(arg0: any) {
    throw new Error('Method not implemented.');
  }
  @ViewChildren('messageElement') messageElements!: QueryList<ElementRef>;

  // Signals for state
  chats = signal<ChatResponse[]>([]);
  contacts = signal<UserResponse[]>([]);
  searchNewContact = signal(false);
  chatSelected = signal<ChatResponse>({} as ChatResponse);
  messagesToSelectedChatt = signal<MessageResponse[]>([]);
  messageToSent: string = '';
  activeUserId!: number;
  replyingToMessage = signal<MessageResponse | null>(null);

  constructor(
    private chatService: ChatService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.chatService.getAllUsers().subscribe({
      next: (res) => {
        const filteredChats = res.filter(chat => !chat.deleted);
        this.chats.set(filteredChats);
        console.log(this.chats())
        const chatId = this.activatedRoute.snapshot.paramMap.get('chatId');
        if (chatId) {
          const chat = this.chats().find((c) => c.chatId === chatId);
          if (chat) {
            this.chatClicked(chat);
          }
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Backend returned code:', err.status);
        console.error('Error body:', err.error);
      }
    });

    this.activeUserId = this.chatService.ActiveUserId;
  }

  ngAfterViewInit() {
    this.scrollToUnreadOrBottom();
    this.messageElements.changes.subscribe(() => {
      this.scrollToUnreadOrBottom();
    });
  }

  // ✅ Start replying to a message
  startReply(message?: MessageResponse): void {
    console.log(message)
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

  chatClicked(chat: ChatResponse) {
    this.chatSelected.set(chat);
    this.replyingToMessage.set(null);
    this.getMessagesToSelectedChatt();

    if (chat.unreadCount > 0) {
      this.onOpenChat(chat.chatId);
    }
  }

  getMessagesToSelectedChatt() {

    this.chatService.getChatMessages(this.chatSelected().chatId).subscribe({
      next: (messages) => {
        this.messagesToSelectedChatt.set(messages);
        console.log(this.messagesToSelectedChatt())
      },
      error: (err) => console.error('Error fetching messages', err)
    });
  }

  onOpenChat(chatId: string) {
    this.chatService.confirmRead(chatId).subscribe({
      next: () => this.chatSelected().unreadCount = 0,
      error: (err) => console.error('Failed to confirm read', err)
    });
  }

  getParentMessageContent(parentMessageId: number | undefined): string {
    if (!parentMessageId) return 'Message not found';
    const parentMessage = this.messagesToSelectedChatt().find(
      (m) => m.messageId === parentMessageId
    );
    return parentMessage?.content || 'Message not found';
  }

  scrollToParentMessage(parentMessageId: number): void {
    console.log('Scrolling to parent message ID:', parentMessageId);
    const parentElement = this.messageElements
      .toArray()
      .find(el => el.nativeElement.getAttribute('data-message-id') === parentMessageId.toString());

    if (parentElement) {
      // Scroll smoothly to the parent
      parentElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add temporary highlight effect
      parentElement.nativeElement.classList.add('highlight-parent');

      // Remove highlight after 1.5 seconds
      setTimeout(() => {
        parentElement.nativeElement.classList.remove('highlight-parent');
      }, 800);
    }
  }

  deleteChat(chatId: string) {


    this.chatService.deleteConversation(chatId).subscribe({
      next: () => {
        console.log('Chat deleted successfully');
        this.chats().splice(this.chats().findIndex(c => c.chatId === chatId), 1);
      },
      error: (err) => {
        console.error('Failed to delete chat', err);
      }
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

  MessageStatus = MessageStatus;

  // Placeholder menu actions
  reply(m: any) { }
  copy(m: any) { }
  replyPrivately(m: any) { }
  forward(m: any) { }
  star(m: any) { }
  pin(m: any) { }
  deleteForMe(m: any) { }
  share(m: any) { }
  react(emoji: string) { }
  moreReactions() { }


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
          this.removeAttachment(); // clear file preview

          // Reset textarea height
          const textarea = document.querySelector<HTMLTextAreaElement>('textarea');
          if (textarea) {
            textarea.style.height = 'auto'; // reset
          }

          this.replyingToMessage.set(null);
          this.getMessagesToSelectedChatt();
        },
        error: (err) => console.error('Error sending message', err),
      });
  }


  // Handle file selection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // If image, create preview URL
      if (this.isImage(this.selectedFile)) {
        const reader = new FileReader();
        reader.onload = () => {
          this.filePreviewUrl = reader.result as string;
        };
        reader.readAsDataURL(this.selectedFile);
      } else {
        this.filePreviewUrl = undefined;
      }
    }
  }

  // Check if file is an image
  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  // Remove file/preview
  removeAttachment(): void {
    this.selectedFile = undefined;
    this.filePreviewUrl = undefined;
  }

  // Auto-resize textarea while typing
  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
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

}
