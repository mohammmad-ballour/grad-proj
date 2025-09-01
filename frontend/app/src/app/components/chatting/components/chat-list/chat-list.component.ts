import { Component, ElementRef, HostListener, QueryList, signal, ViewChildren, TemplateRef, Signal } from '@angular/core';
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

@Component({
  selector: 'app-chat-list',
  templateUrl: 'chat-list.component.html',
  styleUrls: ['chat-list.component.css'],
  imports: [DatePipe, FormsModule, CommonModule, MatMenuModule, MatIconModule, MatDialogModule, MatInputModule],
  standalone: true
})
export class ChatListComponent {


  msgMenu = 'msgMenu_';
  searchTerm: any;

  @ViewChildren('messageElement') messageElements!: QueryList<ElementRef>;

  // Signals for state
  chats = signal<ChatResponse[]>([]);


  contacts = signal<UserResponse[]>([]);


  chatSelected = signal<ChatResponse>({} as ChatResponse);
  messagesToSelectedChatt = signal<MessageResponse[]>([]);
  messageToSent: string = '';
  activeUserId!: number;
  replyingToMessage = signal<MessageResponse | null>(null);
  loadingChats = signal(false);
  loadingMessages = signal(false);
  groupSearchTerm: string = '';
  groupName: any;

  constructor(
    private chatService: ChatService,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) { }
  reverceMessages(): MessageResponse[] {
    return this.messagesToSelectedChatt().reverse()
  }
  ngOnInit() {
    this.loadingChats.set(false);
    this.chatService.getAllUsers().subscribe({
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
    history.replaceState(null, '', `/chats/${chat.chatId}`);
    this.chatSelected.set(chat);
    this.replyingToMessage.set(null);
    this.getMessagesToSelectedChatt();

    if (chat.unreadCount > 0) {
      this.onOpenChat(chat.chatId);
    }
  }

  getMessagesToSelectedChatt() {
    this.loadingMessages.set(false);

    this.chatService.getChatMessages(this.chatSelected().chatId).subscribe({
      next: (messages) => {
        this.messagesToSelectedChatt.set(messages.reverse());
        console.log(this.messagesToSelectedChatt())
      },
      error: (err) => {
        console.error('Error fetching messages', err)
        this.loadingMessages.set(true)
      },
      complete: () => this.loadingMessages.set(true)
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
        // If the deleted chat was selected, clear selection and messages
        if (this.chatSelected().chatId === chatId) {
          this.chatSelected.set({} as ChatResponse);
          this.messagesToSelectedChatt.set([]);
        }
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
  copy(m: any) {
    if (!m) return;
    navigator.clipboard.writeText(m).then(() => {
      console.log('Text copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    }
    );


  }
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

  // Detect media type dynamically





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
  // Component.ts
  messageInfoData: MessageDetailResponse | null = null;

  // These will hold the keys for iteration in the template
  deliveredKeys: string[] = [];
  readKeys: string[] = [];

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
  selectedMessageForMenu!: MessageResponse;

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
    this.dialog.open(templateRef);
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
  participantIds = signal<number[]>([]);
  isGroupMode = false;
  selectedUsers = signal<string[]>([]);


  // Check if group creation is valid
  canCreateGroup(): boolean {
    return true;
  }
  createGroupChat() {
    this.participantIds.set(
      this.contacts().filter(c => !c.canBeAddedToGroupByCurrentUser).map(c => c.userAvatar.userId)
    );
    console.log(this.selectedFile)
    console.log(this.participantIds())
    this.chatService.createGroupChat(this.groupName, this.participantIds(), this.selectedFile)
      .subscribe({
        next: res => {
          console.log('Group created with ID:', res)
          this.router.navigate([AppRoutes.MESSAGES, res])
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

  goToAddMembers() {
    // Logic to continue to members selection step
  }


}


