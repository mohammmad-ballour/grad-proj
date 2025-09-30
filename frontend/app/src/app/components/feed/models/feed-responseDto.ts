import { StatusResponse } from "./StatusWithRepliesResponseDto";

export interface FeedResponse {
    statuses: StatusResponse[];
    unreadMessagesCount: number;
    unreadNotificationsCount: number;
}
