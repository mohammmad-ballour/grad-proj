export interface Notification {
    id: number;
    type: 'like' | 'comment' | 'follow';
    userId: number;
    message: string;
    createdAt: string;
}