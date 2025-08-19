import { Component, output, signal } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { ChatResponse } from '../../models/chat-response';
import { DatePipe } from '@angular/common';
import { UserResponse } from '../../models/user-response';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from "@angular/forms";

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
  message!: string;

  constructor(
    private chatService: ChatService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    // Load existing chats
    this.chatService.getAllUsers().subscribe({
      next: (chats) => {
        console.log('Chats:', chats);
        this.chats.set(chats);
      }
    });

    // Listen for query params (chatId)
    this.route.queryParams.subscribe(params => {
      const chatId = params['chatId'];
      if (chatId) {
        console.log('Opened chatId:', chatId);
      }
    });
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

  getMessagesToSelectedChatt() {
    this.chatService.getChatMessages(this.chatSelected().chatId).subscribe(

      {
        next: (messages) => {
          console.log(messages)
        }
      }
    )
  }

  sendMessage() {
    this.chatService.sendMessage(this.chatSelected().chatId, this.message).subscribe({
      next: (message) => {
        console.log('Message sent:', message);
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
}
