import { Component, HostListener, signal, Output, EventEmitter, ViewChild, TemplateRef } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { ChatResponse } from '../../models/chat-response';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MessageService } from '../../services/message.service';
import { AppRoutes } from '../../../../config/app-routes.enum';
import { UserResponse } from '../../models/user-response';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { catchError, debounceTime, distinctUntilChanged, filter, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { TimeAgoPipe } from "../../../../core/Pipes/TimeAgoPipe";
import { ChatTimeLabelPipe } from "../../../../core/Pipes/chatTimeLabel";

@Component({
  selector: 'app-chat-list',
  templateUrl: 'chat-list.component.html',
  styleUrls: ['chat-list.component.css'],
  imports: [
    FormsModule,
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    DragDropModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    ChatTimeLabelPipe
  ],
  standalone: true
})
export class ChatListComponent {
  concatesSearchTerm: string = '';
  groupName: any = '';
  selectedFile?: File;
  participantIds = signal<number[]>([]);
  isGroupMode = false;
  contacts = signal<UserResponse[]>([]);
  searchTerm = '';
  chats = signal<ChatResponse[]>([]);
  selectedChat = signal<ChatResponse | null>(null);
  loadingChats = signal(false);
  selectedGroupMembers = signal<UserResponse[]>([]);
  groupAvatarPreview: string | null = null;
  dragging = signal(false); // Track drag state for visual feedback
  isSearching = signal(false);

  contactsSearchControl = new FormControl('');
  private destroy$ = new Subject<void>();


  @Output() chatSelected = new EventEmitter<ChatResponse>();
  @ViewChild('t') menuTrigger!: MatMenuTrigger;

  constructor(
    private chatService: ChatService,
    private messageService: MessageService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    // Subscribe to changes in the chatId route param
    this.activatedRoute.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.initChats();
      });

    this.initContactsSearch();
  }

  private initChats(): void {
    console.log('called initChats ')
    this.loadingChats.set(false);
    const deletedChats: string[] = JSON.parse(localStorage.getItem('deletedChats') || '[]');

    this.chatService.getAllChats().subscribe({
      next: (res) => {
        this.chats.set(res.filter(c => !deletedChats.includes(String(c.chatId))));
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

  private initContactsSearch(): void {

    this.contactsSearchControl.valueChanges.pipe(
      map((v: any) => (v || '').toString().trim()),
      debounceTime(1000), // 0.5s feels smoother
      distinctUntilChanged(),
      tap(term => {
        if (term.length < 2) {
          this.contacts.set([]);
        }
      }),
      filter(term => term.length >= 2),
      tap(() => this.isSearching.set(true)), // start spinner
      switchMap(term =>
        this.chatService.getGroupCandidates(term).pipe(
          catchError(err => {
            console.error('Failed to load group candidates', err);
            this.snackBar.open('Failed to load users for group', 'Close', { duration: 4000 });
            return of([] as UserResponse[]);
          }),
          tap(() => this.isSearching.set(false)) // stop spinner
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe((res: UserResponse[]) => {
      const filteredRes = this.isGroupMode
        ? res.filter(u =>
          u.canBeAddedToGroupByCurrentUser &&
          !this.selectedGroupMembers().some(m => m.userAvatar.userId === u.userAvatar.userId)
        )
        : res.filter(u => u.canBeMessagedByCurrentUser);

      this.contacts.set(filteredRes);
    });
  }


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Handle drag-and-drop event
  drop(event: CdkDragDrop<UserResponse[]>) {
    this.dragging.set(false);
    if (event.previousContainer === event.container) {
      // Reorder within the same list
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Prevent dragging if the contact can't be added to a group
      const draggedUser = event.previousContainer.data[event.previousIndex];
      if (event.container.id === 'group-members' && !draggedUser.canBeAddedToGroupByCurrentUser) {
        this.snackBar.open(`${draggedUser.userAvatar.username} cannot be added to groups`, 'Close', { duration: 3000 });
        return;
      }

      // Move between lists
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update participantIds
      this.participantIds.set(this.selectedGroupMembers().map(member => member.userAvatar.userId));

      // Show toast notification
      const action = event.container.id === 'group-members' ? 'added to' : 'removed from';
      this.snackBar.open(`${draggedUser.userAvatar.username} ${action} group`, 'Close', { duration: 2000 });
    }
  }

  // Clear all selected group members
  clearGroupMembers() {
    this.contacts.update(contacts => [...contacts, ...this.selectedGroupMembers()]);
    this.selectedGroupMembers.set([]);
    this.participantIds.set([]);
    this.snackBar.open('Group members cleared', 'Close', { duration: 2000 });
  }

  // Create group chat
  createGroupChat() {
    if (!this.groupName.trim()) {
      this.snackBar.open('Please provide a group name', 'Close', { duration: 3000 });
      return;
    }
    if (this.selectedGroupMembers().length === 0) {
      this.snackBar.open('Please add at least one member to the group', 'Close', { duration: 3000 });
      return;
    }
    console.log(this.selectedGroupMembers())
    this.chatService.createGroupChat(this.groupName, this.participantIds(), this.selectedFile)
      .subscribe({
        next: (res: string) => {
          this.snackBar.open('Group created successfully!', 'Close', { duration: 3000 });
          this.router.navigate([`${AppRoutes.MESSAGES}`, res]);
          this.selectedGroupMembers.set([]);
          this.groupName = '';
          this.groupAvatarPreview = null;
          this.closeDialog();
          this.selectedFile = undefined;
        },
        error: err => {
          this.selectedFile = undefined;
          this.selectedGroupMembers.set([]);
          this.groupName = '';
          this.groupAvatarPreview = null;
          console.error(err);
          this.snackBar.open('Failed to create group. Please try again.', 'Close', { duration: 3000 });
        }
      });
  }

  // Handle group avatar selection
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

  // UI Helpers
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

  // Chat Actions
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
        // update selectedChat
        this.selectedChat.update(c =>
          c && c.chatId === chatId ? { ...c, unreadCount: 0 } : c
        );

        // update chats list
        this.chats.set(
          this.chats().map(chat =>
            chat.chatId === chatId ? { ...chat, unreadCount: 0 } : chat
          )
        );
      },
      error: (err) => console.error('Failed to confirm read', err)
    });
  }


  deleteChat(chatId: string) {
    this.chatService.deleteConversation(chatId).subscribe({
      next: () => {
        console.log('Chat deleted successfully');
        this.chats.set(this.chats().filter(c => c.chatId !== chatId));
        // If the deleted chat is currently selected, reset selection and navigate
        if (this.selectedChat()?.chatId === chatId) {
          this.chatSelected.emit({} as ChatResponse);
          // this.router.navigate([AppRoutes.MESSAGES]);
        }
      },
      error: (err) => {
        console.error('Failed to delete chat:', err);

      },
      complete: () => {
        console.log(this.chats())
        console.log('Delete request completed');
      }
    });
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

  // Sorting & Filtering
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

  // Context Menu
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

  @HostListener('document:click', ['$event'])
  onDocumentClick() {
    if (this.menuTrigger?.menuOpen) {
      this.menuTrigger.closeMenu();
    }
  }

  // Dialog and Chat Creation
  openChat(userId: number): void {
    this.chatService.createOneOnOneChat(userId).subscribe({
      next: (chatId: string) => {

        const deletedChats: string[] = JSON.parse(localStorage.getItem('deletedChats') || '[]');
        const updatedDeletedChats = deletedChats.filter(id => id !== chatId);
        localStorage.setItem('deletedChats', JSON.stringify(updatedDeletedChats));

        //check if the id exit in local storage delete it from it 
        console.log(chatId)
        this.closeDialog();
        this.router.navigate([`${AppRoutes.MESSAGES}`, chatId]);
      },
      error: (err) => {
        this.snackBar.open('Failed to open chat. Please try again later.', 'Close', { duration: 3000 });
      }
    });
  }

  closeDialog() {
    this.contactsSearchControl.setValue('');
    this.dialog.closeAll();
  }
  cancelDialog() {
    this.selectedGroupMembers.set([]);
    this.groupName = '';
    this.groupAvatarPreview = null;
    this.closeDialog();
    this.selectedFile = undefined;
  }

  getGroupCandidates(): void {
    this.chatService.getGroupCandidates(this.concatesSearchTerm).subscribe({
      next: (res: UserResponse[]) => {
        const filteredRes = this.isGroupMode
          ? res.filter(u => u.canBeAddedToGroupByCurrentUser && !this.selectedGroupMembers().some(m => m.userAvatar.userId === u.userAvatar.userId))
          : res.filter(u => u.canBeMessagedByCurrentUser);
        this.contacts.set(filteredRes);
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
    this.concatesSearchTerm = '';
    this.contacts.set([]);
    this.selectedGroupMembers.set([]);
    this.groupAvatarPreview = null;
    this.dialog.open(templateRef);
  }

  // Track drag state
  onDragStarted() {
    this.dragging.set(true);
  }

  onDragEnded() {
    this.dragging.set(false);
  }
}