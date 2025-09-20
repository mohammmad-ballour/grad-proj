

import { UserAvatar } from "../../profile/models/ProfileResponseDto";

export interface UserResponse {
  userAvatar: UserAvatar;
  profileBio: string;
  isVerified: boolean;
  isFollowedByCurrentUser: boolean;
  isFollowingCurrentUser: boolean;
  canBeMessagedByCurrentUser: boolean;
  canBeAddedToGroupByCurrentUser: boolean;
}

