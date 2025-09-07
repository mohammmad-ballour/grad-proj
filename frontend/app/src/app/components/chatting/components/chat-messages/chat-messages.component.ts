import { Component, ElementRef, HostListener, QueryList, signal, ViewChildren, ViewChild, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
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
export type ScrollDirectionCustameType = 'UP' | 'DOWN' | 'NOTCHANGE';

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
  @Input() activeUserName!: number;

  messagesToSelectedChatt = signal<MessageResponse[]>([]);
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

  constructor(
    private chatService: ChatService,
    private messageService: MessageService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    this.getMessagesToSelectedChatt();
  }

  // ngAfterViewInit() {
  //   this.scrollToUnreadOrBottom();
  //   this.messageElements.changes.subscribe(() => {
  //     this.scrollToUnreadOrBottom();
  //   });
  // }

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

  GoToParentMesaage(messageId: number) {
    const parent = this.messagesToSelectedChatt().find((m) => m.messageId == messageId) as MessageResponse
    if (parent)
      this.scrollToParentMessage(parent.messageId);
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
      }
        , 800);
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
    const next = msgs[index + 1];
    return !next || next.senderAvatar.userId !== current.senderAvatar.userId;
  }

  wrapMessage(lastMessage: string | undefined): string {
    if (lastMessage && lastMessage.length <= 20) return lastMessage;
    return lastMessage ? lastMessage.substring(0, 17) + '...' : '';
  }

  private lastScrollTop = 0; // store last scroll position

  lockscroll: boolean = false;

  onScroll(event: Event) {
    const container = event.target as HTMLElement;
    const currentScrollTop = container.scrollTop;
    const scrollDirectionResult: ScrollDirectionCustameType = (currentScrollTop > this.lastScrollTop) ? 'DOWN' : (currentScrollTop < this.lastScrollTop) ? 'UP' : 'NOTCHANGE';
    this.lastScrollTop = currentScrollTop;

    console.log(scrollDirectionResult);
    // Load older messages when near the top and scrolling up
    if (
      currentScrollTop < 10 &&
      this.hasMoreMessages() &&
      !this.loadingOlderMessages &&
      !this.isAutoScroll &&
      scrollDirectionResult === 'UP'

    ) {
      if (this.parentData && this.parentData.gapBefore.exists) {
        this.oldestMessageId = this.parentData.gapBefore.lastMessageId;
        this.oldestMessageTimestamp = this.parentData.gapBefore.lastMessageSentAt;
      }

      this.loadMessages(container, scrollDirectionResult, this.parentData?.gapBefore.missingCount ?? 10);
    }

    // Load newer messages when near the bottom and scrolling down
    const scrollBottom = container.scrollHeight - currentScrollTop - container.clientHeight;
    if (
      !this.lockscroll &&

      !this.isAutoScroll &&
      scrollDirectionResult === 'DOWN'
      &&
      this.parentData?.gapAfter.exists
    ) {
      if (this.parentData?.gapAfter.exists) {
        this.newestMessageId = this.parentData.gapAfter.lastMessageId;
        this.newestMessageTimestamp = this.parentData.gapAfter.lastMessageSentAt;
      }
      this.lockscroll = true
      console.log('befor call loadMessages from Down ')
      this.loadMessages(container, scrollDirectionResult, this.parentData?.gapAfter.missingCount);
    }
    // console.log(this.parentData == null)
  }



  loadMessages(container: HTMLElement, scrollDirection: ScrollDirectionCustameType, missingMessagesCount: number) {
    if (!this.chatSelected) return;

    const previousScrollHeight = container.scrollHeight;
    const previousScrollTop = container.scrollTop;
    const previousScrollBottom = previousScrollHeight - previousScrollTop - container.clientHeight;

    let seekRequest: TimestampSeekRequest;
    if (scrollDirection === 'UP') {
      this.loadingOlderMessages = true;
      seekRequest = {
        lastHappenedAt: this.oldestMessageTimestamp,
        lastEntityId: this.oldestMessageId,
      };
    } else {
      seekRequest = {
        lastHappenedAt: this.newestMessageTimestamp,
        lastEntityId: this.newestMessageId,
      };
    }


    console.log(seekRequest)

    this.messageService.getChatMessages(this.chatSelected.chatId, scrollDirection, seekRequest, missingMessagesCount)
      .subscribe({
        next: (msgs) => {


          if (msgs.length === 0) {
            if (scrollDirection === 'UP') {
              this.hasMoreMessages.set(false);
            } else {
              this.hasMoreNewer.set(false);
            }
          } else {
            const reversed = msgs.reverse();

            if (scrollDirection === 'UP') {
              this.messagesToSelectedChatt.update(curr => [...reversed, ...curr]);
              console.log('loded messages when scroll up')
              console.log(msgs)
            } else if (scrollDirection == 'DOWN' && this.parentData?.gapAfter.exists) {

              this.messagesToSelectedChatt.update(curr => {
                // find the index of the last entity in the current messages
                const idx = curr.findIndex(m => m.messageId === seekRequest.lastEntityId);

                if (idx !== -1) {
                  // insert new messages *after* that index
                  const before = curr.slice(0, idx + 1);
                  const after = curr.slice(idx + 1);
                  return [...before, ...msgs.reverse(), ...after];
                } else {
                  // fallback: just append to end
                  console.log('fall')
                  return [...curr, ...msgs];
                }
              });
              this.lockscroll = true;
              // this.messagesToSelectedChatt.update(curr => [...curr, ...reversed]);
              console.log('loded messages when scroll down')
              console.log(msgs.reverse())
            }

            if (this.parentData) {
              console.log("test")
              if (scrollDirection === 'UP' && this.parentData.gapBefore.exists) {
                this.parentData.gapBefore.missingCount -= msgs.length;
                this.parentData.gapBefore.exists = this.parentData.gapBefore.missingCount > 0;
                if (!this.parentData.gapBefore.exists) {
                  this.hasMoreMessages.set(false);
                }
              } else if (scrollDirection === 'DOWN' && this.parentData.gapAfter.exists) {
                this.parentData.gapAfter.missingCount -= msgs.length;
                this.parentData.gapAfter.exists = this.parentData.gapAfter.missingCount > 0;
                if (!this.parentData.gapAfter.exists) {
                  this.hasMoreNewer.set(false);
                }
              }
            }

            if (scrollDirection === 'UP') {
              const oldest = reversed[0];
              this.oldestMessageTimestamp = oldest.sentAt;
              this.oldestMessageId = oldest.messageId;
            } else if (scrollDirection == 'DOWN') {
              const newest = reversed.reverse()[reversed.reverse().length - 1];
              this.newestMessageTimestamp = newest.sentAt;
              this.newestMessageId = newest.messageId;
            }

            requestAnimationFrame(() => {
              // const newScrollHeight = container.scrollHeight;
              // if (scrollDirection === 'UP') {
              //   // Keep relative to top
              //   container.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight);
              // } else {
              //   // Keep relative to bottom
              //   container.scrollTop = newScrollHeight - container.clientHeight - previousScrollBottom;
              // }
            });
          }
          console.log("new lodeed  messages")

          console.log(msgs)
        },
        error: (err) => {
          console.error(err);
        },
        complete: () => {
          console.log("full messages")
          console.log(this.messagesToSelectedChatt())
          if (scrollDirection === 'UP') {
            this.loadingOlderMessages = false;
          }
          this.lockscroll = false;
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

  viewParent(ParentMessageId: number) {
    // Case 1: message already loaded
    const existing = this.messagesToSelectedChatt().find(m => m.messageId === ParentMessageId);
    if (existing) {
      this.scrollToParentMessage(ParentMessageId);
      return;
    }

    // Case 2: fetch from backend
    this.messageService.getParentMessageWithNeighbours(this.chatSelected.chatId, ParentMessageId, this.oldestMessageId)
      .subscribe({
        next: (data) => {
          this.parentData = data;

          this.messagesToSelectedChatt.update(curr => [...data.messages, ...curr]);

          console.log(data)
          // Handle gapBefore
          if (data.gapBefore.exists) {
            this.hasMoreMessages.set(true);
            console.log(`⚠️ Missing ${data.gapBefore.missingCount} messages before ID ${data.gapBefore.lastMessageId}`);
            // You could insert a "Load older messages" placeholder here
          }

          // Handle gapAfter
          if (data.gapAfter.exists) {
            this.hasMoreNewer.set(true);
            console.log(`⚠️ Missing ${data.gapAfter.missingCount} messages after ID ${data.gapAfter.lastMessageId}`);
            // Same idea, insert "Load newer messages"
          }

          // After update, scroll to the parent


        },
        error: (err) => console.error('Error loading parent message:', err),
        complete: () => {
          console.log(this.messagesToSelectedChatt())
          this.isAutoScroll = true;
          setTimeout(() => this.scrollToParentMessage(ParentMessageId), 100);
        }
      });
  }

}