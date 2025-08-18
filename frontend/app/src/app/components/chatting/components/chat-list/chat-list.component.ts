import { Component, input, InputSignal, output, signal } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { ChatResponse } from '../../models/chat-response';
import { DatePipe } from '@angular/common';
import { UserResponse } from '../../models/user-response';

@Component({
  selector: 'app-chat-list',
  templateUrl: 'chat-list.component.html',
  imports: [
    DatePipe
  ],
  styleUrl: 'chat-list.component.css'
})
export class ChatListComponent {
  chats = signal<ChatResponse[]>([]);
  searchNewContact = false;

  chatSelected = output<ChatResponse>();

  constructor(private chatService: ChatService) { }

  ngOnInit() {
    this.chatService.getAllUsers().subscribe({
      next: (chats) => {
        console.log(chats);
        this.chats.set(chats); // ✅ now works
      }
    });
  }

  selectChat(chat: ChatResponse) {
    this.chatSelected.emit(chat);
  }

  searchContact() {
    this.chatService.getAllUsers()
      .subscribe({
        next: (users) => {
          console.log(users);
          this.searchNewContact = true;
        }
      });
  }

  selectContact(contact: UserResponse) {
    // Example: add contact to chats here
  }

  chatClicked(chat: ChatResponse) {
    this.chatSelected.emit(chat);
  }

  wrapMessage(lastMessage: string | undefined): string {
    if (lastMessage && lastMessage.length <= 20) {
      return lastMessage;
    }
    return lastMessage?.substring(0, 17) + '...';
  }
}
