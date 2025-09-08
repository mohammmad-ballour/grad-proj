import { Component, ElementRef, HostListener, QueryList, signal, ViewChildren, ViewChild, EventEmitter, Input, Output, SimpleChanges, OnDestroy, AfterViewInit } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { MessageService } from '../../services/message.service';
import { ChatResponse } from '../../models/chat-response';
import { MessageResponse, MessageStatus, TimestampSeekRequest, ParentMessageSnippet, MediaType, ParentMessageWithNeighbours } from '../../models/message-response';
import { MatMenuTrigger, MatMenu, MatMenuPanel } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MessageDetailResponse } from '../../models/message-detail-response';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { Observable, of, tap, finalize } from 'rxjs';
export type ScrollDirectionCustameType = 'UP' | 'DOWN' | 'NOTCHANGE';

interface GapPlaceholder {
  type: 'gap-before' | 'gap-after';
  missingCount: number;
  lastMessageId: number;
  lastMessageSentAt: string;
}

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [DatePipe, FormsModule, CommonModule, MatMenuModule, MatIconModule, MatDialogModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './chat-messages.component.html',
  styleUrls: ['./chat-messages.component.css']
})

export class ChatMessagesComponent implements AfterViewInit, OnDestroy {



  @Output() reply = new EventEmitter<any>();
  @ViewChild('t') menuTrigger!: MatMenuTrigger;
  @ViewChildren('messageElement') messageElements!: QueryList<ElementRef>;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  @Input() chatSelected!: ChatResponse;
  @Input() activeUserId!: number;
  @Input() activeUserName!: number;

  messagesToSelectedChatt = signal<(MessageResponse | GapPlaceholder)[]>([]);
  messageToSent: string = '';
  replyingToMessage = signal<MessageResponse | null>(null);
  loadingMessages = signal(false);
  loadingOlderMessages = false;
  loadingNewerMessages = false;
  groupName: any;
  infoMenu!: MatMenu;
  messageInfoData: MessageDetailResponse | null = null;
  selectedFile?: File;
  filePreviewUrl?: string;

  deliveredKeys: string[] = [];
  readKeys: string[] = [];

  MessageStatus = MessageStatus;
  hasMoreMessages = signal(true);
  hasMoreNewer = signal(false);
  oldestMessageTimestamp!: string;
  oldestMessageId!: number;
  newestMessageTimestamp!: string;
  newestMessageId!: number;
  msgMenu!: MatMenuPanel<any> | null;
  parentData!: ParentMessageWithNeighbours;
  isAutoScroll: boolean = false;
  private observer: IntersectionObserver | null = null;
  private fillingGapType: 'gap-before' | 'gap-after' | null = null;

  constructor(
    private chatService: ChatService,
    private messageService: MessageService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    this.getMessagesToSelectedChatt();

  }

  ngAfterViewInit() {
    this.messageElements.changes.subscribe(() => {
      this.setupGapObservers();
    });
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chatSelected'] && this.chatSelected) {
      this.getMessagesToSelectedChatt();
    }
  }

  trackByMessageId(index: number, item: MessageResponse | GapPlaceholder) {
    return 'messageId' in item ? item.messageId : item.type;
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

  GoToParentMesaage(messageId: number) {
    const parent = this.messagesToSelectedChatt().find((m) => this.isMessage(m) && m.messageId == messageId) as MessageResponse | undefined;
    if (parent) {
      this.scrollToParentMessage(parent.messageId);
    }
  }

  scrollToParentMessage(parentMessageId: number): void {
    const parentElement = this.messageElements
      .toArray()
      .find(el => el.nativeElement.getAttribute('data-message-id') === parentMessageId.toString());

    if (parentElement) {
      parentElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      parentElement.nativeElement.classList.add('highlight-parent');
      setTimeout(() => {
        parentElement.nativeElement.classList.remove('highlight-parent');
        this.isAutoScroll = false;
      }, 800);
    }
  }

  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }

  processImage(image: string | undefined): string {
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
    if (!this.isMessage(current)) return false;
    const next = msgs[index + 1];
    if (!this.isMessage(next)) return true;
    return next.senderAvatar.userId !== current.senderAvatar.userId;
  }

  wrapMessage(lastMessage: string | undefined): string {
    if (lastMessage && lastMessage.length <= 20) return lastMessage;
    return lastMessage ? lastMessage.substring(0, 17) + '...' : '';
  }



  private lastScrollTop = 0; // store last scroll position

  lockscroll: boolean = false;

  private scrollToUnreadOrBottom() {
    const unreadCount = this.chatSelected.unreadCount;
    const messages = this.messageElements.toArray();

    if (!messages.length) return;

    setTimeout(() => {

      if (unreadCount > 0) {
        let count = 0;
        const firstUnreadElement = messages.find(el => {
          const messageId = el.nativeElement.getAttribute('data-message-id');
          if (messageId) count++;
          return count > (messages.length - unreadCount);
        });
        if (firstUnreadElement) firstUnreadElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    this.hasMoreNewer.set(false);
    this.oldestMessageTimestamp!;
    this.oldestMessageId!;

    this.messageService.getChatMessages(this.chatSelected.chatId, 'UP')
      .subscribe({
        next: (messages) => {
          console.log(messages)
          const reversedMessages = messages.reverse();
          this.messagesToSelectedChatt.update(m => reversedMessages);
          if (reversedMessages.length > 0) {
            const oldest = reversedMessages[0];
            this.oldestMessageTimestamp = oldest.sentAt;
            this.oldestMessageId = oldest.messageId;

            const newest = reversedMessages[reversedMessages.length - 1];
            this.newestMessageTimestamp = newest.sentAt;
            this.newestMessageId = newest.messageId;
          }
        },
        error: (err) => console.error('Error fetching messages', err),
        complete: () => {
          this.loadingMessages.set(true);
          this.scrollToUnreadOrBottom();
        }
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

  viewParent(ParentMessageId: number) {
    // Case 1: message already loaded
    const existing = this.messagesToSelectedChatt().find(m => this.isMessage(m) && m.messageId === ParentMessageId);
    if (existing) {
      this.scrollToParentMessage(ParentMessageId);
      return;
    }

    // Case 2: fetch from backend
    this.messageService.getParentMessageWithNeighbours(this.chatSelected.chatId, ParentMessageId, this.oldestMessageId)
      .subscribe({
        next: (data) => {
          this.parentData = data;

          const newList: (MessageResponse | GapPlaceholder)[] = [];
          if (data.gapBefore.exists) {
            newList.push({
              type: 'gap-before',
              missingCount: data.gapBefore.missingCount,
              lastMessageId: data.gapBefore.lastMessageId,
              lastMessageSentAt: data.gapBefore.lastMessageSentAt
            });
          }
          newList.push(...data.messages.sort((a, b) => a.messageId - b.messageId));
          if (data.gapAfter.exists) {
            newList.push({
              type: 'gap-after',
              missingCount: data.gapAfter.missingCount,
              lastMessageId: data.gapAfter.lastMessageId,
              lastMessageSentAt: data.gapAfter.lastMessageSentAt
            });
          }

          this.messagesToSelectedChatt.update(curr => [...newList, ...curr]);

          console.log(data)
          // Handle gapBefore
          if (data.gapBefore.exists) {
            this.hasMoreMessages.set(true);
            console.log(`⚠️ Missing ${data.gapBefore.missingCount} messages before ID ${data.gapBefore.lastMessageId}`);
          }

          // Handle gapAfter
          if (data.gapAfter.exists) {
            this.hasMoreNewer.set(true);
            console.log(`⚠️ Missing ${data.gapAfter.missingCount} messages after ID ${data.gapAfter.lastMessageId}`);
          }

          // Update oldest and newest
          const actualMsgs = this.messagesToSelectedChatt().filter(this.isMessage).sort((a, b) => a.messageId - b.messageId);
          if (actualMsgs.length > 0) {
            this.oldestMessageId = actualMsgs[0].messageId;
            this.oldestMessageTimestamp = actualMsgs[0].sentAt;
            this.newestMessageId = actualMsgs[actualMsgs.length - 1].messageId;
            this.newestMessageTimestamp = actualMsgs[actualMsgs.length - 1].sentAt;
          }
        },
        error: (err) => console.error('Error loading parent message:', err),
        complete: () => {
          console.log(this.messagesToSelectedChatt())
          this.isAutoScroll = true;
          setTimeout(() => this.scrollToParentMessage(ParentMessageId), 100);
        }
      });
  }











  private loadInitialMessages() {
    if (!this.chatSelected) return;
    this.hasMoreMessages.set(true);
    this.hasMoreNewer.set(false);

    this.messageService.getChatMessages(this.chatSelected.chatId, 'UP')
      .subscribe({
        next: (messages) => {
          const reversed = messages.reverse();
          this.messagesToSelectedChatt.set(reversed);
          if (reversed.length > 0) {
            this.oldestMessageTimestamp = reversed[0].sentAt;
            this.oldestMessageId = reversed[0].messageId;
            this.newestMessageTimestamp = reversed[reversed.length - 1].sentAt;
            this.newestMessageId = reversed[reversed.length - 1].messageId;
          }
        },
        error: (err) => console.error('Error fetching messages', err),
        complete: () => setTimeout(() => this.scrollToBottom(), 0)
      });
  }

  private scrollToBottom() {
    const container = this.scrollContainer.nativeElement;
    container.scrollTop = container.scrollHeight;
  }

  @HostListener('scroll', ['$event'])
  onScroll(event: Event) {
    const container = event.target as HTMLElement;
    const currentScrollTop = container.scrollTop;

    const scrollDirection: ScrollDirectionCustameType = currentScrollTop > this.lastScrollTop ? 'DOWN'
      : currentScrollTop < this.lastScrollTop ? 'UP' : 'NOTCHANGE';

    this.lastScrollTop = currentScrollTop;

    // Load older messages
    if (scrollDirection === 'UP' && currentScrollTop < 50 && this.hasMoreMessages() && !this.loadingOlderMessages) {
      this.loadMessages('UP').subscribe();
    }

    // Load newer messages
    const scrollBottom = container.scrollHeight - currentScrollTop - container.clientHeight;
    if (scrollDirection === 'DOWN' && scrollBottom < 50 && this.hasMoreNewer() && !this.loadingNewerMessages) {
      this.loadMessages('DOWN').subscribe();
    }
  }

  private loadMessages(direction: 'UP' | 'DOWN', missingMessagesCount?: number): Observable<MessageResponse[]> {
    if (!this.chatSelected) return of([]);

    const container = this.scrollContainer.nativeElement;
    const prevScrollHeight = container.scrollHeight;
    const prevScrollTop = container.scrollTop;

    const seekRequest: TimestampSeekRequest = {
      lastHappenedAt: direction === 'UP' ? this.oldestMessageTimestamp : this.newestMessageTimestamp,
      lastEntityId: direction === 'UP' ? this.oldestMessageId : this.newestMessageId
    };

    if (direction === 'UP') this.loadingOlderMessages = true;
    else this.loadingNewerMessages = true;

    return this.messageService.getChatMessages(this.chatSelected.chatId, direction, seekRequest, missingMessagesCount ?? 10).pipe(
      tap(messages => {
        if (!messages.length) {
          direction === 'UP' ? this.hasMoreMessages.set(false) : this.hasMoreNewer.set(false);
          return;
        }

        const reversed = messages.reverse();
        this.messagesToSelectedChatt.update(curr => direction === 'UP'
          ? [...reversed, ...curr]
          : [...curr, ...reversed]);

        // Update oldest/newest
        const allMessages = this.messagesToSelectedChatt().filter(m => 'messageId' in m) as MessageResponse[];
        this.oldestMessageId = allMessages[0].messageId;
        this.oldestMessageTimestamp = allMessages[0].sentAt;
        this.newestMessageId = allMessages[allMessages.length - 1].messageId;
        this.newestMessageTimestamp = allMessages[allMessages.length - 1].sentAt;
      }),
      finalize(() => {
        if (direction === 'UP') {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
          this.loadingOlderMessages = false;
        } else {
          if (this.isUserAtBottom(container)) container.scrollTop = container.scrollHeight;
          this.loadingNewerMessages = false;
        }
      })
    );
  }

  private isUserAtBottom(container: HTMLElement, threshold = 50) {
    return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
  }

  // ---------------- IntersectionObserver for Gaps  why not work ----------------
  private setupGapObservers() {
    if (this.observer) this.observer.disconnect();

    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const gapType = el.getAttribute('data-gap-type') as 'gap-before' | 'gap-after' | null;
        if (!gapType) return;

        const direction = gapType === 'gap-before' ? 'UP' : 'DOWN';
        const missingMessagesCount = direction == 'UP' ? this.parentData.gapBefore.missingCount : this.parentData.gapAfter.missingCount
        const loading = direction === 'UP' ? this.parentData.gapBefore.lastMessageId : this.parentData.gapAfter.lastMessageId;

        if (!loading) {
          console.log(direction)
          console.log(missingMessagesCount)
          this.loadMessages(direction, missingMessagesCount).subscribe(() => {
            this.messagesToSelectedChatt.update(curr => curr.filter(m => this.isMessage(m) || m.type !== gapType));
            this.observer?.unobserve(el);
          });
        }
      });
    }, { threshold: 0.1 });

    this.observeGapElements();
    this.messageElements.changes.subscribe(() => this.observeGapElements());
  }

  private observeGapElements() {
    this.messageElements.forEach(elRef => {
      const el = elRef.nativeElement;
      if (el.hasAttribute('data-gap-type')) this.observer?.observe(el);
    });
  }

  isMessage(item: MessageResponse | GapPlaceholder): item is MessageResponse {
    return 'messageId' in item;
  }
}
