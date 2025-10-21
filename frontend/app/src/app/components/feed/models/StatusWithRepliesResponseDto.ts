
export interface StatusWithRepliesResponse {
    statusResponse: StatusResponse,
    replies: ReplySnippet[];
}
interface UserAvatar {
    userId: string;
    displayName: string;
    username: string;
    profilePicture: string; // (byte) → base64 or URL on backend
}




export interface ReplySnippet {
    replyId: string;           // Long → safest as string (to avoid JS number overflow)
    content: string;
    postedAt: string;          // Instant → ISO date string
    user: UserAvatar;
    numLikes: number;
    numReplies: number;
    numShares: number;
    medias: MediaResponse[];
    isLikedByCurrentUser: boolean;
    isSavedToBookmarks: boolean;
}

export interface StatusResponse {
    userAvatar: UserAvatar;
    statusId: string; // serialized with ToStringSerializer → use string in TS
    content: string;
    privacy: StatusPrivacy;
    replyAudience: StatusAudience;
    isCurrentUserAllowedToReply: boolean;
    shareAudience: StatusAudience;
    isCurrentUserAllowedToShare: boolean;
    mentionedUsers: string[];
    postedAt: string; // Instant → ISO string in TS
    numLikes: number;
    numReplies: number;
    numShares: number;
    medias: MediaResponse[];
    parentStatusSnippet: ParentStatusSnippet | null;
    isStatusLikedByCurrentUser: boolean;
    parentAssociation: ParentAssociation;
    isSavedToBookmarks: boolean
}

export enum ParentAssociation {
    REPLY = 'REPLY',
    SHARE = 'SHARE'
}


export enum StatusPrivacy {
    PUBLIC = "PUBLIC",
    FOLLOWERS = "FOLLOWERS",
    PRIVATE = "PRIVATE"
}
export enum StatusAudience {
    EVERYONE = "EVERYONE",
    FOLLOWERS = "FOLLOWERS",
    ONLY_ME = "ONLY_ME"
}
export interface MediaResponse {
    mediaId: string;      // Long → serialized as string in JSON (safe choice)
    mediaUrl: string;
    mimeType: string;
    sizeInBytes: number;  // Java long → number in TS
    position: number;
}

export interface ParentStatusSnippet {
    parentUserAvatar: UserAvatar;
    parentStatusId: string;   // Long with ToStringSerializer → string
    content: string;
    privacy: StatusPrivacy;   // your enum/type
    postedAt: string;         // Instant → ISO date string
    medias: MediaResponse[];
}



export interface ParentStatus {
    statusId: string;
    statusOwnerId: string;
    parentAssociation: string; // Match your enum string
}

export interface CreateStatusRequest {
    content: string;
    privacy: StatusPrivacy;        // Enum: StatusPrivacy
    replyAudience: StatusAudience;  // Enum: StatusAudience
    shareAudience: StatusAudience;  // Enum: StatusAudience
    parentStatus?: ParentStatus;
}



/** === UpdateStatusSettings DTO === */
export interface UpdateStatusSettings {
    statusPrivacy: StatusPrivacy;      // must match Java field name
    replyAudience: StatusAudience;
    shareAudience: StatusAudience;
}

/** === UpdateStatusContent DTO === */
export interface UpdateStatusContent {
    newContent: string;        // must match 'newContent' (not 'content')
    keepMediaIds?: string[];   // Java List<Long> → TS string[]
    removeMediaIds?: string[]; // Java List<Long> → TS string[]
}
