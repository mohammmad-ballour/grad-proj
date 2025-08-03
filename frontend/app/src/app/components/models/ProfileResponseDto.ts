export interface ProfileResponseDto {

    userId: number;
    username: string;
    userAvatar: {
        displayName: string;
        profilePicture: string; // (byte) → base64 or URL on backend
    };
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
    posts: PostCard[];

}

export interface PostCard {
    content: string;
    postedAt: string;
    isPinned: boolean;
}
