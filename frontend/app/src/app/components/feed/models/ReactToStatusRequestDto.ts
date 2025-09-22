export interface ReactToStatusRequest {
    statusId: number;
    statusOwnerId: number;
}

export interface StatusActionDto {
    statusId: number;
    statusOwnerId: number;
    numLikes: number;
    numReplies: number;
    numShares: number;
    liked: boolean;
}
