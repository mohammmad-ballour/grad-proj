import { Component, ElementRef, HostListener, QueryList, signal, ViewChildren, ViewChild, EventEmitter, Input, Output, SimpleChanges, OnDestroy, AfterViewInit } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { MessageService } from '../../services/message.service';
import { ChatResponse } from '../../models/chat-response';
import { MessageResponse, MessageStatus, ParentMessageWithNeighbours } from '../../models/message-response';
import { MatMenuTrigger, MatMenu, MatMenuPanel } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule, DatePipe, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MessageDetailResponse } from '../../models/message-detail-response';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { finalize, Subscription } from 'rxjs';
import { UserAvatar } from '../../../profile/models/ProfileResponseDto';
import { MembersDialogComponent } from './members-dialog/members-dialog.component';
import { TimestampSeekRequest } from '../../../models/TimestampSeekRequestDto';

export type ScrollDirectionCustameType = 'UP' | 'DOWN' | 'NOTCHANGE';

interface GapPlaceholder {
  type: 'gap-after';
  missingCount: number;
  lastMessageId: number;
  lastMessageSentAt: string;
}

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [DatePipe, FormsModule, CommonModule, MatMenuModule, MatIconModule, MatDialogModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './chat-messages.component.html',
  styleUrls: ['./chat-messages.component.css'],
  providers: [DatePipe]
})
export class ChatMessagesComponent implements AfterViewInit, OnDestroy {
  // ---------- your existing fielddts ----------
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

  deliveredKeys: number[] = [];
  readKeys: number[] = [];

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
  private fillingGapType: 'gap-after' | null = null;

  // ---------- NEW: date bubble state ----------
  dateBubbleVisible = signal(false);
  currentDateLabel = signal('');
  private hideDateBubbleTimeout: any = null;
  private rafPending = false;

  // Inside the ChatMessagesComponent class
  private scrollSubscriptions: Subscription[] = []; // Store subscriptions to clean up
  private lastScrollTop = 0; // store last scroll position

  members: UserAvatar[] = [];

  constructor(
    private messageService: MessageService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private datePipe: DatePipe // NEW
  ) { }
  // fields
  currentDateIso = signal<string>('');  // ⬅️ NEW


  // ---------- your existing helpers ----------
  GetMemberName(userID: number): string | undefined {
    return this.members.find(m => m.userId == userID)?.displayName;
  }

  ngAfterViewInit() {
    this.messageElements.changes.subscribe(() => {
      this.setupGapObservers();
      this.updateDateBubble(true); // NEW: update bubble when list changes
    });

    // also after first render
    setTimeout(() => this.updateDateBubble(true), 0); // NEW
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chatSelected'] && this.chatSelected) {
      // ✅ Clear/reset all state before loading the new chat (your existing logic)
      this.messagesToSelectedChatt.set([]);
      this.replyingToMessage.set(null);
      this.messageToSent = '';
      this.selectedFile = undefined;
      this.filePreviewUrl = undefined;
      this.deliveredKeys = [];
      this.readKeys = [];
      this.messageInfoData = null;

      this.hasMoreMessages.set(true);
      this.hasMoreNewer.set(false);
      this.loadingMessages.set(true);
      this.loadingOlderMessages = false;
      this.loadingNewerMessages = false;

      this.oldestMessageId = 0;
      this.newestMessageId = 0;
      this.oldestMessageTimestamp = '';
      this.newestMessageTimestamp = '';

      this.isAutoScroll = false;
      if (this.observer) this.observer.disconnect();

      // NEW: reset bubble
      this.dateBubbleVisible.set(false);
      this.currentDateLabel.set('');

      // ✅ Now fetch messages for the new chat
      this.getMessagesToSelectedChatt();
      if (this.chatSelected.group) this.loadGroupMembers();
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

  private scrollToUnreadOrBottom() {
    const unreadCount = Number(this.chatSelected?.unreadCount ?? 0);

    const messagesChanges$ = this.messageElements.changes;

    const scrollTo = () => {
      const messages = this.messageElements.toArray();
      if (!messages.length) return;

      if (unreadCount > 0 && unreadCount < messages.length) {
        const firstUnreadIndex = messages.length - unreadCount;
        const firstUnreadEl = messages[firstUnreadIndex]?.nativeElement;
        if (firstUnreadEl) {
          firstUnreadEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }

      const lastEl = messages[messages.length - 1]?.nativeElement;
      if (lastEl) lastEl.scrollIntoView({ behavior: 'auto', block: 'end' });
    };

    if (this.messageElements.length) {
      scrollTo();
    } else {
      const sub = messagesChanges$.subscribe(() => {
        scrollTo();
        sub.unsubscribe();
      });
    }
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
          this.updateDateBubble(true); // NEW: ensure label after initial render
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
    navigator.clipboard.writeText(m).then(() => { }).catch(err => console.error(err));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(_: MouseEvent) {
    if (this.menuTrigger?.menuOpen) this.menuTrigger.closeMenu();
  }

  // ---------------- Message Info ----------------
  fetchMessageInfo(messageId: number): void {
    this.messageService.getMessageInfo(messageId).subscribe({
      next: (info: MessageDetailResponse) => {
        this.messageInfoData = info;
        this.deliveredKeys = info.deliveredByAt ? Object.keys(info.deliveredByAt).map(k => Number(k)) : [];
        this.readKeys = info.readByAt ? Object.keys(info.readByAt).map(k => Number(k)) : [];
      },
      error: (err) => {
        this.deliveredKeys = [];
        this.readKeys = [];
        this.messageInfoData = null;
        console.error(err);
      }
    });
  }

  currentMenuTrigger?: MatMenuTrigger | null = null;
  currentMenuMessage?: MessageResponse | null = null;

  onMenuOpened(trigger: MatMenuTrigger, message?: MessageResponse) {
    this.currentMenuTrigger = trigger;
    this.currentMenuMessage = message ?? null;
  }

  onMenuClosed(trigger?: MatMenuTrigger) {
    if (this.currentMenuTrigger === trigger) {
      this.currentMenuTrigger = null;
      this.currentMenuMessage = null;
    }
  }

  openInfoFromContextInfo(infoMenu: MatMenu, message: MessageResponse) {
    if (!this.currentMenuTrigger) return;
    this.fetchMessageInfo(message.messageId);

    const trigger = this.currentMenuTrigger;
    const originalMenu = trigger.menu;

    trigger.closeMenu();
    trigger.menu = infoMenu;

    setTimeout(() => {
      trigger.openMenu();
      const sub = trigger.menuClosed.subscribe(() => {
        trigger.menu = originalMenu;
        sub.unsubscribe();
      });
    }, 200);
  }

  private scrollToBottom() {
    const container = this.scrollContainer.nativeElement;
    container.scrollTop = container.scrollHeight;
  }

  private isUserAtBottom(container: HTMLElement, threshold = 50) {
    return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
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

  @HostListener('scroll', ['$event'])
  onScroll(event: Event) {
    if (this.oldestMessageId == 0 && this.oldestMessageTimestamp == '')
      return;

    const container = event.target as HTMLElement;
    const currentScrollTop = container.scrollTop;

    // Load older messages (existing)
    if (currentScrollTop < this.lastScrollTop && currentScrollTop < 50 && this.hasMoreMessages() && !this.loadingOlderMessages) {
      this.loadMessages('UP');
    }
    this.lastScrollTop = currentScrollTop;

    // NEW: throttle date bubble update to one per animation frame
    if (!this.rafPending) {
      this.rafPending = true;
      requestAnimationFrame(() => {
        this.rafPending = false;
        this.updateDateBubble();
      });
    }
  }

  private loadMessages(direction: 'UP' | 'DOWN', missingMessagesCount: number = 10, lastMessageId?: number, lastMessageSentAt?: string): void {
    if (!this.chatSelected || this.loadingOlderMessages || this.loadingNewerMessages) return;

    const container = this.scrollContainer.nativeElement;
    const prevScrollHeight = container.scrollHeight;
    const prevScrollTop = container.scrollTop;

    const seekRequest: TimestampSeekRequest = {
      lastHappenedAt: lastMessageSentAt ?? (direction === 'UP' ? this.oldestMessageTimestamp : this.newestMessageTimestamp),
      lastEntityId: lastMessageId ?? (direction === 'UP' ? this.oldestMessageId : this.newestMessageId)
    };

    if (direction === 'UP') this.loadingOlderMessages = true;
    else this.loadingNewerMessages = true;

    this.messageService.getChatMessages(this.chatSelected.chatId, direction, seekRequest, missingMessagesCount)
      .pipe(finalize(() => {
        this.loadingOlderMessages = false;
        this.loadingNewerMessages = false;
        this.fillingGapType = null;
      }))
      .subscribe({
        next: (messages) => {
          if (!messages.length) {
            direction === 'UP' ? this.hasMoreMessages.set(false) : this.hasMoreNewer.set(false);
            return;
          }

          const reversed = direction === 'UP' ? messages.reverse() : messages;

          this.messagesToSelectedChatt.update(curr => {
            if (direction === 'DOWN') {
              const referenceIndex = curr.findIndex(item =>
                this.isMessage(item) && item.messageId === seekRequest.lastEntityId
              );
              let updated: (MessageResponse | GapPlaceholder)[] = [...curr];

              if (referenceIndex !== -1) {
                const remaining = missingMessagesCount - messages.length;
                updated.splice(referenceIndex + 1, remaining > 0 ? 0 : 1, ...reversed);

                if (remaining > 0) {
                  const nextIndex = referenceIndex + 1 + reversed.length;
                  const nextItem = updated[nextIndex];
                  if (nextItem && !this.isMessage(nextItem)) {
                    nextItem.lastMessageId = reversed[reversed.length - 1].messageId;
                    nextItem.lastMessageSentAt = reversed[reversed.length - 1].sentAt;
                    nextItem.missingCount = remaining;
                  }
                }
              }
              return updated;
            } else {
              return [...reversed, ...curr];
            }
          });

          const allMessages = this.messagesToSelectedChatt().filter(this.isMessage) as MessageResponse[];
          if (allMessages.length > 0) {
            this.oldestMessageId = allMessages[0].messageId;
            this.oldestMessageTimestamp = allMessages[0].sentAt;
            this.newestMessageId = allMessages[allMessages.length - 1].messageId;
            this.newestMessageTimestamp = allMessages[allMessages.length - 1].sentAt;
          }
        },
        error: (err) => {
          console.error('Error loading messages:', err);
          this.snackBar.open('Failed to load messages', 'Close', { duration: 3000 });
        },
        complete: () => {
          if (direction === 'UP') {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
          } else {
            if (this.isUserAtBottom(container)) this.scrollToBottom();
          }

          // NEW: keep date bubble accurate after content changes
          this.updateDateBubble(true);
        }
      });
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
    this.scrollSubscriptions.forEach(sub => sub.unsubscribe());
    if (this.hideDateBubbleTimeout) clearTimeout(this.hideDateBubbleTimeout);
  }

  private setupGapObservers() {
    if (this.isAutoScroll) return;
    if (this.observer) this.observer.disconnect();

    this.observer = new IntersectionObserver(entries => {
      if (this.isAutoScroll || this.fillingGapType) return;

      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target as HTMLElement;
        const gapType = el.getAttribute('data-gap-type') as 'gap-after' | null;
        if (!gapType) return;

        if (this.isAutoScroll) return;

        const missingCount = parseInt(el.getAttribute('data-missing-count') || '0');
        const lastMessageId = parseInt(el.getAttribute('data-last-message-id') || '0');
        const lastMessageSentAt = el.getAttribute('data-last-message-sent-at') || '';

        if (missingCount <= 0 || !lastMessageId || !lastMessageSentAt) return;

        this.fillingGapType = gapType;
        this.loadMessages('DOWN', missingCount, lastMessageId, lastMessageSentAt);
      });
    }, { threshold: 0.1 });

    this.observeGapElements();
    this.messageElements.changes.subscribe(() => this.observeGapElements());
  }

  viewParent(ParentMessageId: number) {
    if (this.observer) this.observer.disconnect();

    const existing = this.messagesToSelectedChatt().find(m => this.isMessage(m) && m.messageId === ParentMessageId);
    if (existing) {
      this.isAutoScroll = true;
      this.scrollToParentMessage(ParentMessageId);
      return;
    }

    this.isAutoScroll = true;
    this.messageService.getParentMessageWithNeighbours(this.chatSelected.chatId, ParentMessageId, this.oldestMessageId)
      .subscribe({
        next: (data) => {
          if (data == null) {
            this.snackBar.open('this message was deleted ', 'Close', { duration: 3000 });
            return;
          }
          const newList: (MessageResponse | GapPlaceholder)[] = [];
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
          if (data.gapBefore.exists) this.hasMoreMessages.set(true);
          if (data.gapAfter.exists) this.hasMoreNewer.set(true);
          const actualMsgs = this.messagesToSelectedChatt().filter(this.isMessage).sort((a, b) => a.messageId - b.messageId);
          if (actualMsgs.length > 0) {
            this.oldestMessageId = actualMsgs[0].messageId;
            this.oldestMessageTimestamp = actualMsgs[0].sentAt;
            this.newestMessageId = actualMsgs[actualMsgs.length - 1].messageId;
            this.newestMessageTimestamp = actualMsgs[actualMsgs.length - 1].sentAt;
          }
        },
        error: (err) => {
          console.error('Error loading parent message:', err);
          this.isAutoScroll = false;
        },
        complete: () => {
          setTimeout(() => {
            this.scrollToParentMessage(ParentMessageId);
            setTimeout(() => {
              this.isAutoScroll = false;
              this.setupGapObservers();
              this.updateDateBubble(true); // NEW
            }, 1000);
          }, 100);
        }
      });
  }

  scrollToParentMessage(parentMessageId: number): void {
    const parentElement = this.messageElements
      .toArray()
      .find(el => el.nativeElement.getAttribute('data-message-id') === parentMessageId.toString());

    if (parentElement) {
      this.isAutoScroll = true;

      parentElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      parentElement.nativeElement.classList.add('highlight-parent');

      setTimeout(() => {
        parentElement.nativeElement.classList.remove('highlight-parent');
        setTimeout(() => {
          this.isAutoScroll = false;
          this.setupGapObservers();
          this.updateDateBubble(true); // NEW
        }, 300);
      }, 800);
    } else {
      this.isAutoScroll = false;
    }
  }

  trackByMessage(index: number, item: any): string | number {
    if (this.isMessage(item)) return item.messageId;
    return `${item.type}-${item.lastMessageId}`;
  }

  loadGroupMembers() {
    this.messageService.getGroupMembers(this.chatSelected.chatId).subscribe({
      next: (res) => this.members = res,
      error: (err) => console.error('Error loading members:', err)
    });
  }

  openMembersDialog() {
    const dialogRef = this.dialog.open(MembersDialogComponent, {
      data: { members: this.members, activeUserId: this.activeUserId },
      width: '300px',
      height: '350px'
    });

    dialogRef.afterClosed().subscribe(() => { });
  }

  getMemberNamesPreview(): string {
    const maxMembersToShow = 3;
    const memberNames = this.members
      .filter(member => member.userId !== this.activeUserId)
      .slice(0, maxMembersToShow)
      .map(member => member.displayName);
    if (memberNames.length === 0) return 'No members';
    let preview = memberNames.join(', ');
    if (this.members.length > maxMembersToShow) {
      preview += ` and ${this.members.length - maxMembersToShow} more`;
    }
    return preview;
  }
  private friendlyDateLabel(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();

    if (start(d) === start(now)) return 'Today';
    if (start(d) === start(now) - 86_400_000) return 'Yesterday';
    return formatDate(d, 'EEE, MMM d, y', 'en-US');
  }
  // ---------- NEW: Date-bubble helpers ----------
  private updateDateBubble(force = false) {
    const container = this.scrollContainer?.nativeElement;
    if (!container) return;

    // Compute label from first visible message (your existing logic)
    const label = this.computeFirstVisibleDateLabel(container);
    if (!label) return;

    if (force || this.currentDateLabel() !== label) {
      this.currentDateLabel.set(label);
    }

    // If the inline day chip for this label is currently visible, hide the pinned bubble.
    const chipsForLabel = this.getDayChipsForLabel(label);
    const dayChipVisible = this.isAnyElVisibleInContainer(chipsForLabel, container, 6 /*px*/);

    if (dayChipVisible) {
      this.dateBubbleVisible.set(false);
      if (this.hideDateBubbleTimeout) clearTimeout(this.hideDateBubbleTimeout);
      return; // don't schedule auto-hide; it's already hidden because chip is in view
    }

    // Otherwise, show the pinned bubble while scrolling and auto-hide after 1.8s
    this.dateBubbleVisible.set(true);
    if (this.hideDateBubbleTimeout) clearTimeout(this.hideDateBubbleTimeout);
    this.hideDateBubbleTimeout = setTimeout(() => this.dateBubbleVisible.set(false), 1800);
  }


  private computeFirstVisibleDateLabel(container: HTMLElement): string | null {
    const containerRect = container.getBoundingClientRect();
    const topY = containerRect.top + 12;

    let candidateIdx = -1;
    let bestDelta = Number.POSITIVE_INFINITY;

    const els = this.messageElements?.toArray() ?? [];
    for (let i = 0; i < els.length; i++) {
      const el = els[i].nativeElement as HTMLElement;
      if (el.hasAttribute('data-gap-type')) continue; // skip gaps

      const r = el.getBoundingClientRect();
      const delta = r.top - topY;
      if (delta >= -8 && delta < bestDelta) {
        bestDelta = delta;
        candidateIdx = i;
      }
    }

    // fallback: last element in view
    if (candidateIdx === -1) {
      for (let i = els.length - 1; i >= 0; i--) {
        const el = els[i].nativeElement as HTMLElement;
        if (el.hasAttribute('data-gap-type')) continue;
        const r = el.getBoundingClientRect();
        if (r.top < containerRect.bottom && r.bottom > containerRect.top) {
          candidateIdx = i;
          break;
        }
      }
    }

    if (candidateIdx === -1) return null;

    const item = this.messagesToSelectedChatt()[candidateIdx];
    if (!this.isMessage(item)) return null;

    return this.friendlyDateLabel(item.sentAt);
  }
  /** yyyy-mm-dd key in LOCAL time (backend sentAt is UTC, Date converts to local for labeling) */
  private dayKey(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  /** find previous real message (skips gap placeholders) */
  private prevMessageIndex(idx: number): number {
    for (let i = idx - 1; i >= 0; i--) {
      const it = this.messagesToSelectedChatt()[i];
      if (this.isMessage(it)) return i;
    }
    return -1;
  }

  /** show divider at first message or when day changes from previous message */
  shouldShowDayDivider(index: number): boolean {
    const list = this.messagesToSelectedChatt();
    const curr = list[index];
    if (!this.isMessage(curr)) return false;

    const prevIdx = this.prevMessageIndex(index);
    if (prevIdx === -1) return true;

    const prev = list[prevIdx] as MessageResponse;
    return this.dayKey(curr.sentAt) !== this.dayKey(prev.sentAt);
  }

  /** label for divider (Today / Yesterday / formatted date) */
  dayLabelForIndex(index: number): string {
    const list = this.messagesToSelectedChatt();
    const curr = list[index];
    if (!this.isMessage(curr)) return '';
    return this.friendlyDateLabel(curr.sentAt);
  }
  /** true if any element is visibly intersecting the scroll container */
  private isAnyElVisibleInContainer(els: HTMLElement[], container: HTMLElement, minPx = 1): boolean {
    const cRect = container.getBoundingClientRect();
    return els.some(el => {
      const r = el.getBoundingClientRect();
      const overlapX = Math.max(0, Math.min(r.right, cRect.right) - Math.max(r.left, cRect.left));
      const overlapY = Math.max(0, Math.min(r.bottom, cRect.bottom) - Math.max(r.top, cRect.top));
      return overlapX > 0 && overlapY >= minPx;
    });
  }

  /** find all day-divider chips whose text matches the label */
  private getDayChipsForLabel(label: string): HTMLElement[] {
    const container = this.scrollContainer?.nativeElement;
    if (!container) return [];
    const chips = Array.from(container.querySelectorAll<HTMLElement>('.day-chip'));
    return chips.filter(ch => (ch.textContent || '').trim() === label.trim());
  }



}
