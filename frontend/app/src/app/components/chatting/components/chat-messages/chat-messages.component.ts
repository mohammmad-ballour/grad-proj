import { Component, ElementRef, HostListener, QueryList, signal, ViewChildren, ViewChild, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { MessageService } from '../../services/message.service';
import { ChatResponse } from '../../models/chat-response';
import { MessageResponse, MessageStatus, MediaType, TimestampSeekRequest } from '../../models/message-response';
import { MatMenuTrigger, MatMenu, MatMenuPanel } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { filter } from 'rxjs';
import { MessageDetailResponse } from '../../models/message-detail-response';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [DatePipe, FormsModule, CommonModule, MatMenuModule, MatIconModule, MatDialogModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './chat-messages.component.html',
  styleUrls: ['./chat-messages.component.css']
})
export class ChatMessagesComponent {

  @Output() reply = new EventEmitter<any>();
  @ViewChild('t') menuTrigger!: MatMenuTrigger;
  @ViewChildren('messageElement') messageElements!: QueryList<ElementRef>;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  @Input() chatSelected!: ChatResponse;
  @Input() activeUserId!: number;

  messagesToSelectedChatt = signal<MessageResponse[]>([]);
  messageToSent: string = '';
  replyingToMessage = signal<MessageResponse | null>(null);
  loadingMessages = signal(false);
  loadingOlderMessages = false;
  groupName: any;
  infoMenu!: MatMenu;
  messageInfoData: MessageDetailResponse | null = null;
  selectedFile?: File;
  filePreviewUrl?: string;

  deliveredKeys: string[] = [];
  readKeys: string[] = [];

  MessageStatus = MessageStatus;
  hasMoreMessages = signal(true);
  oldestMessageTimestamp!: string;
  oldestMessageId!: number;
  msgMenu!: MatMenuPanel<any> | null;

  constructor(
    private chatService: ChatService,
    private messageService: MessageService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    this.getMessagesToSelectedChatt();
  }

  ngAfterViewInit() {
    this.scrollToUnreadOrBottom();
    this.messageElements.changes.subscribe(() => {
      this.scrollToUnreadOrBottom();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chatSelected'] && this.chatSelected) {
      this.getMessagesToSelectedChatt();
    }
  }

  trackByMessageId(index: number, message: MessageResponse) {
    return message.messageId;
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
    const parentMessage = this.messagesToSelectedChatt().find(
      (m) => m.messageId === parentMessageId
    );
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

  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }

  processImage(image: string): string {
    return `data:image/png;base64,${image}`;
  }

  processVideo(media: string): string {
    if (!media) return '';
    return `data:video/mp4;base64,${media}`;
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

  // ---------------- Scroll / Pagination ----------------
  onScroll(event: Event) {

    //can detect the scroll is upor down
    console.log("called from onScroll  ")

    const container = event.target as HTMLElement;
    if (container.scrollTop < 10 && this.hasMoreMessages() && !this.loadingOlderMessages) {
      this.loadOlderMessages(container);
    }
  }

  loadOlderMessages(container: HTMLElement) {
    console.log("called from  loadOlderMessages ")
    if (!this.chatSelected || !this.hasMoreMessages()) return;

    this.loadingOlderMessages = true;
    const previousScrollHeight = container.scrollHeight;

    const seekRequest: TimestampSeekRequest = {
      lastHappenedAt: this.oldestMessageTimestamp,
      lastEntityId: this.oldestMessageId,
    };
    console.log(seekRequest);

    this.messageService.getChatMessages(this.chatSelected.chatId, 'UP', seekRequest)
      .subscribe({
        next: (msgs) => {
          console.log(msgs)

          if (msgs.length === 0) {
            this.hasMoreMessages.set(false);
            this.loadingOlderMessages = false;
          } else {
            //enhance user experince when loded older messages
            this.messagesToSelectedChatt.update(curr => [...msgs.reverse(), ...curr]);
            const oldest = msgs[0];
            this.oldestMessageTimestamp = oldest.sentAt;
            this.oldestMessageId = oldest.messageId;
            this.scrollToParentMessage(msgs[5].messageId)

            setTimeout(() => {
              const newScrollHeight = container.scrollHeight;
              container.scrollTop = newScrollHeight - previousScrollHeight;
              this.loadingOlderMessages = false;
            }, 0);
          }
        },
        error: (err) => {
          console.error(err);
          this.loadingOlderMessages = false;
        },
        complete: () => {
          this.scrollToParentMessage(this.messagesToSelectedChatt()[5].messageId)
        },
      });
  }

  private scrollToUnreadOrBottom() {
    const container = this.scrollContainer.nativeElement;
    const unreadCount = this.chatSelected.unreadCount;
    const messages = this.messageElements.toArray();
    if (!messages.length) return;

    setTimeout(() => {
      if (unreadCount > 0) {
        const firstUnreadIndex = Math.max(messages.length - unreadCount, 0);
        const element = messages[firstUnreadIndex]?.nativeElement;
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const lastElement = messages[messages.length - 1]?.nativeElement;
        if (lastElement) lastElement.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
    }, 0);
  }

  // ---------------- Fetch Messages ----------------
  getMessagesToSelectedChatt() {
    if (!this.chatSelected) return;

    this.loadingMessages.set(false);
    this.hasMoreMessages.set(true);

    this.messageService.getChatMessages(this.chatSelected.chatId)
      .subscribe({
        next: (messages) => {
          this.messagesToSelectedChatt.update(m => messages.reverse());
          const oldest = messages[0];
          console.log(messages)
          console.log(oldest)
          if (oldest) {
            this.oldestMessageTimestamp = oldest.sentAt;
            this.oldestMessageId = oldest.messageId;
          }
        },
        error: (err) => console.error('Error fetching messages', err),
        complete: () => this.loadingMessages.set(true)
      });
  }

  // ---------------- Send / Reply / Attach ----------------
  sendMessage(): void {
    if ((!this.messageToSent.trim() && !this.selectedFile) || !this.isChatSelected()) return;

    const parentMessageId = this.replyingToMessage()?.messageId ? +this.replyingToMessage()!.messageId : undefined;

    this.messageService
      .sendMessage(this.chatSelected.chatId, this.messageToSent, this.selectedFile, parentMessageId)
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

  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isVideo(file: File): boolean {
    return file.type.startsWith('video/');
  }

  removeAttachment(): void {
    this.selectedFile = undefined;
    this.filePreviewUrl = undefined;
  }

  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  copy(m: any) {
    if (!m) return;
    navigator.clipboard.writeText(m).then(() => console.log('Text copied')).catch(err => console.error(err));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.menuTrigger?.menuOpen) this.menuTrigger.closeMenu();
  }

  // ---------------- Message Info ----------------
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
        console.error(err);
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
}


