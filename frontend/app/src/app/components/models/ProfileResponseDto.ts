export interface ProfileResponseDto {
    userAvatar: {
        userId: number;
        displayName: string;
        profilePicture: string; // (byte) → base64 or URL on backend
    };
    username: string;

    profileCoverPhoto: string;
    profileBio: string;
    joinedAt: string;
    aboutUser: {
        gender: string;
        dob: string;
        residence: string;
        timezoneId: string;
    };
    followingNo?: number;
    followerNo?: number;
    isBeingFollowed: boolean;   // false if it is user's own profile'
    posts: PostCard[];
    followingPriority: string;
    isBlocked: boolean;
    isMuted: boolean;
    canBeMessaged: boolean
}
export interface PostCard {
    content: string;
    postedAt: string;
    isPinned: boolean;
}
export interface UserAvatar {
    userId: number;
    displayName: string;
    username: string;
    profilePicture: string; // (byte) → base64 or URL on backend
}





