export interface NotificationDto {
  id: number;
  type: string;
  recipientId: number;
  statusId: number;
  lastUpdatedAt: string; // ISO date string (Instant)
  actorCount: number;
  groupingState: 'UNREAD_YET' | 'HAS_NEW_ACTIVITY' | 'READ';
  actorNames: string[];
  lastActorProfilePicture: string | null;
  statusContent: string | null;
}
