export interface MessageDetailResponse {
    delivered: boolean;
    read: boolean;
    readByAt: { [userId: string]: string };       // ISO 8601 date string
    deliveredByAt: { [userId: string]: string };  // ISO 8601 date string
}
