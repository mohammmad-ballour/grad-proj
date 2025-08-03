import { LogInRequestDto } from "./LogInRequestDto";

export interface SignUpRequestDto extends LogInRequestDto {

    username: string;
    dob: string;
    residence: string;
    timezoneId: string;
    gender: string;

}
