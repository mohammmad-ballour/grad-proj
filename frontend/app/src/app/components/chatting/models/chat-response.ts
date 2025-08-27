
export interface ChatResponse {
  chatId: string;
  name?: string;
  chatPicture: string; // Base64 encoded
  lastMessage?: string;
  lastMessageTime?: string;
  onlineRecipientsNumber?: number; // fix here!
  unreadCount: number;
  pinned: boolean;
  muted: boolean;
  Deleted: boolean;
  messageType: string;
  chatMembersNumber: number;

}






