import { Component, ElementRef, HostListener, QueryList, signal, ViewChildren, TemplateRef, Signal, EventEmitter, Input, Output, input } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { ChatResponse } from '../../models/chat-response';
import { CommonModule, DatePipe } from '@angular/common';
import { UserResponse } from '../../models/user-response';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageResponse, MessageStatus } from '../../models/message-response';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from "@angular/material/icon";
import { ViewChild } from '@angular/core';
import { MessageDetailResponse } from '../../models/message-detail-response';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { AppRoutes } from '../../../../config/app-routes.enum';
import { filter } from 'rxjs';
import { MessageService } from '../../services/message.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SimpleChanges } from '@angular/core';
@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [DatePipe, FormsModule, CommonModule, MatMenuModule, MatIconModule, MatDialogModule, MatInputModule],
  templateUrl: './chat-messages.component.html',
  styleUrls: ['./chat-messages.component.css']
})
export class ChatMessagesComponent {
  // @Input() messages: any[] = [];
  // @Input() chatt!: ChatResponse;
  // @Input() activeUserId!: number;
  // @Input() loadingMessages = false;
  // @Input() messageInfoData: any;
  // @Input() deliveredKeys: string[] = [];
  // @Input() readKeys: string[] = [];

  @Output() reply = new EventEmitter<any>();
  // @Output() copyText = new EventEmitter<string>();
  // @Output() openInfo = new EventEmitter<any>();
  // @Output() scrollToParent = new EventEmitter<number>();
  @ViewChild('t') menuTrigger!: MatMenuTrigger;
  @ViewChildren('messageElement') messageElements!: QueryList<ElementRef>;
  selectedMessageForMenu!: MessageResponse;
  MessageStatus = MessageStatus;

  @Input() chatSelected!: ChatResponse;
  @Input() activeUserId!: number;
  messagesToSelectedChatt = signal<MessageResponse[]>([]);
  messageToSent: string = '';
  replyingToMessage = signal<MessageResponse | null>(null);
  loadingMessages = signal(false);
  groupName: any;
  infoMenu!: MatMenu;
  messageInfoData: MessageDetailResponse | null = null;
  selectedFile?: File;
  filePreviewUrl?: string;

  // These will hold the keys for iteration in the template
  deliveredKeys: string[] = [];
  readKeys: string[] = [];
  constructor(
    private chatService: ChatService,
    private messageService: MessageService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    //if chatSelected is changed in parent there is proble the previous message is remide and new chat messages not lodedd
    this.getMessagesToSelectedChatt()
  }


  ngAfterViewInit() {
    this.scrollToUnreadOrBottom();
    this.messageElements.changes.subscribe(() => {
      this.scrollToUnreadOrBottom();
    });
  }

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chatSelected'] && this.chatSelected) {
      this.getMessagesToSelectedChatt();
    }
  }


  getMessagesToSelectedChatt() {
    this.loadingMessages.set(false);

    this.messageService.getChatMessages(this.chatSelected.chatId).subscribe({
      next: (messages) => {
        this.messagesToSelectedChatt.update(m => messages.reverse());
        console.log(this.messagesToSelectedChatt())
      },
      error: (err) => {
        console.error('Error fetching messages', err)
        this.loadingMessages.set(true)
      },
      complete: () => this.loadingMessages.set(true)
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

  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }

  processImage(image: string): string {
    return `data:image/png;base64,${image}`;
  }

  isChatSelected(): boolean {
    const chat = this.chatSelected;
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
    const unreadCount = this.chatSelected.unreadCount;
    const messages = this.messageElements.toArray();
    if (!messages.length) return;

    if (unreadCount > 0) {
      const firstUnreadIndex = Math.max(messages.length - unreadCount, 0);
      messages[firstUnreadIndex]?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      messages[messages.length - 1].nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }


  // Placeholder menu actions
  copy(m: any) {
    if (!m) return;
    navigator.clipboard.writeText(m).then(() => {
      console.log('Text copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    }
    );


  }




  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close menu if click is outside the open menu
    if (this.menuTrigger?.menuOpen) {
      this.menuTrigger.closeMenu();
    }
  }


  sendMessage(): void {
    if ((!this.messageToSent.trim() && !this.selectedFile) || !this.isChatSelected()) return;

    const parentMessageId = this.replyingToMessage()?.messageId
      ? +this.replyingToMessage()!.messageId
      : undefined;

    this.messageService
      .sendMessage(this.chatSelected.chatId, this.messageToSent, this.selectedFile, parentMessageId)
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
  onFileSelected(event: Event,): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];



      // Check file size (max 25 MB)
      const maxSize = 25 * 1024 * 1024; // 25MB in bytes
      if (file.size > maxSize) {
        this.snackBar.open('File size must be less than 25 MB.', 'Close', { duration: 6000 });
        return;
      }

      this.selectedFile = file;

      // If image, create preview URL
      if (this.isImage(file)) {
        const reader = new FileReader();
        reader.onload = () => {
          this.filePreviewUrl = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.filePreviewUrl = undefined;
      }
    }
  }

  // Check if file is an image
  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  // Check if file is a video
  isVideo(file: File): boolean {
    return file.type.startsWith('video/');
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
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuChat!: ChatResponse; // chat object for which menu opened

  fetchMessageInfo(messageId: number): void {
    this.chatService.getMessageInfo(messageId).subscribe({
      next: (info: MessageDetailResponse) => {
        this.messageInfoData = info;
        console.log("Fetched message info:", this.messageInfoData);

        // Precompute keys for template
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

    // Temporarily switch the trigger to open the info menu
    trigger.menu = infoMenu;

    setTimeout(() => {
      trigger.openMenu();
      const sub = trigger.menuClosed.subscribe(() => {
        trigger.menu = originalMenu;
        sub.unsubscribe();
      });
    }, 440);
  }

  processVideo(media: string): string {
    if (!media) return '';
    return `data:video/mp4;base64,${media}`;

  }




}