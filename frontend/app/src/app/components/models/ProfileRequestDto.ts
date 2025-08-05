export interface ProfileRequestDto {
    displayName: string | null;
    dob: string | null;
    gender: string | null;
    residence: string | null;
    timezoneId: string | null;
    profileBio: string | null;
    profilePicture: File | null;
    profileCoverPhoto: File | null;
}
