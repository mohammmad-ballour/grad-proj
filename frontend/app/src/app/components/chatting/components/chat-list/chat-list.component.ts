import { Component, ElementRef, output, QueryList, signal, ViewChildren } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { ChatResponse } from '../../models/chat-response';
import { CommonModule, DatePipe } from '@angular/common';
import { UserResponse } from '../../models/user-response';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from '@angular/common/http';
import { MessageResponse, MessageStatus } from '../../models/message-response';

@Component({
  selector: 'app-chat-list',
  templateUrl: 'chat-list.component.html',
  imports: [DatePipe, MatIconModule, FormsModule, CommonModule],
  styleUrl: 'chat-list.component.css'
})
export class ChatListComponent {
  // });

  // Signals for state
  chats = signal<ChatResponse[]>([]);
  contacts = signal<UserResponse[]>([]);
  searchNewContact = signal(false);
  // Output event when a chat is selected
  chatSelected = signal<ChatResponse>({} as ChatResponse);
  messagesToSelectedChatt = signal<MessageResponse[]>([]);
  messageToSent!: string;
  activeUserId!: string | null;

  constructor(
    private chatService: ChatService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    // Load existing chats
    this.chatService.getAllUsers().subscribe({
      next: (res) => {
        console.log(res)
        this.chats.set(res)
        if (this.activatedRoute.snapshot.queryParamMap.get('chatid'))
          //retrive the chat from chats() the pass it to the next  method
          this.chatClicked(-----)
      },
      error: (err: HttpErrorResponse) => {
        console.error('Backend returned code:', err.status);
        console.error('Error body:', err.error);
      }
    });

    this.activeUserId = this.chatService.ActiveUserId;




  }

  onImageError(event: Event, fallback: string): void {
    (event.target as HTMLImageElement).src = fallback;
  }
  processImage(image: string) {
    return `data:image/png;base64,${image}`
  }
  // Select existing chat
  chatClicked(chat: ChatResponse) {
    this.chatSelected.set(chat)
    this.getMessagesToSelectedChatt()
    if (chat.unreadCount > 0)
      this.onOpenChat(chat.chatId)

  }
  onOpenChat(chatId: number) {
    this.chatService.confirmRead(chatId).subscribe({
      next: () => {
        console.log(`Read status updated for chat ${chatId}`)
        this.chatSelected().unreadCount = 0
      },
      error: (err) => console.error('Failed to confirm read', err)
    });
  }

  isChatSelected(): boolean {
    const chat = this.chatSelected();
    return chat && Object.keys(chat).length > 0;
  }

  getMessagesToSelectedChatt() {
    this.chatService.getChatMessages(this.chatSelected().chatId).subscribe(

      {
        next: (messages) => {
          this.messagesToSelectedChatt.set(messages)
          console.log(messages)
        }
      }
    )
  }

  sendMessage() {
    this.chatService.sendMessage(this.chatSelected().chatId, this.messageToSent).subscribe({
      next: (message) => {

        this.messageToSent = '';
        this.getMessagesToSelectedChatt();

      },
      error: (err) => {
        console.error('Error sending message', err);
      }
    });

  }
  // Switch to "search new contact" mode
  searchContact() {
    // this.chatService.getAllUsers().subscribe({
    //   next: (users) => {
    //     console.log('Contacts:', users);
    //     // this.contacts.set(users);
    //     this.searchNewContact.set(true);
    //   }
    // });
  }

  // Select new contact
  selectContact(contact: UserResponse) {
    console.log('Contact selected:', contact);
    // You can call chatService.createOneOnOneChat(contact.id) here if needed
  }

  // Truncate long messages
  wrapMessage(lastMessage: string | undefined): string {
    if (lastMessage && lastMessage.length <= 20) {
      return lastMessage;
    }
    return lastMessage ? lastMessage.substring(0, 17) + '...' : '';
  }





  @ViewChildren('messageElement') messageElements!: QueryList<ElementRef>;

  ngAfterViewInit() {
    this.scrollToUnreadOrBottom();

    // React if messages change
    this.messageElements.changes.subscribe(() => {
      this.scrollToUnreadOrBottom();
    });
  }

  private scrollToUnreadOrBottom() {
    const unreadCount = this.chatSelected().unreadCount;
    const messages = this.messageElements.toArray();

    if (!messages.length) return;

    if (unreadCount > 0) {
      // Clamp index so it won’t go below 0
      const firstUnreadIndex = Math.max(messages.length - unreadCount, 0);
      const firstUnreadElement = messages[firstUnreadIndex]?.nativeElement;

      if (firstUnreadElement) {
        firstUnreadElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Scroll to last message
      messages[messages.length - 1].nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }

  MessageStatus = MessageStatus; // expose enum to template




}
