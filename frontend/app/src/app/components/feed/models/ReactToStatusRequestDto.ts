import { StatusPrivacy, StatusAudience } from "./StatusWithRepliesResponseDto";

export interface ReactToStatusRequest {
    statusId: string;
    statusOwnerId: string;
}

export interface StatusActionDto {
    statusId: string;
    statusOwnerId: string;
    numLikes: number;
    numReplies: number;
    numShares: number;
    liked: boolean;
    saved: boolean;
    isCurrentUserAllowedToReply: boolean;
    isCurrentUserAllowedToShare: boolean;
    privacy: StatusPrivacy;
    replyAudience: StatusAudience;
    shareAudience: StatusAudience;
    profilePicture: string;
    username: string;
    postedAt: string;
    content: string;
}

