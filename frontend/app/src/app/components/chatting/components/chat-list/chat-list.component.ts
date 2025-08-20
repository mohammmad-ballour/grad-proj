import { Component, ElementRef, output, QueryList, signal, ViewChildren } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { ChatResponse } from '../../models/chat-response';
import { DatePipe } from '@angular/common';
import { UserResponse } from '../../models/user-response';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from '@angular/common/http';
import { MessageResponse } from '../../models/message-response';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-chat-list',
  templateUrl: 'chat-list.component.html',
  imports: [DatePipe, MatIconModule, FormsModule],
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
  ) { }

  ngOnInit() {
    this.chatSelected().unreadCount
    // Load existing chats
    this.chatService.getAllUsers().subscribe({
      next: (res) => {
        console.log(res)
        this.chats.set(res)
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
    console.log(chat)
    this.getMessagesToSelectedChatt()
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
  }

  private scrollToUnreadOrBottom() {
    const unreadCount = this.chatSelected().unreadCount;
    const messages = this.messageElements.toArray();

    if (!messages.length) return;

    if (unreadCount > 0) {
      // Find the first unread index
      const firstUnreadIndex = messages.length - unreadCount;
      const firstUnreadElement = messages[firstUnreadIndex]?.nativeElement;

      if (firstUnreadElement) {
        firstUnreadElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // No unread → scroll to bottom
      messages[messages.length - 1].nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }
}
