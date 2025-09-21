export interface ReactToStatusRequest {
    statusId: string;
    statusOwnerId: number;
}

export interface StatusActionDto {
    statusId: string;
    statusOwnerId: number;
    numLikes: number;
    numReplies: number;
    numShares: number;
    liked: boolean;
}
