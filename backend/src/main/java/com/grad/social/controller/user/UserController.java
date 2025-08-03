package com.grad.social.controller.user;

import com.grad.grad_proj.generated.api.UsersApi;
import com.grad.grad_proj.generated.api.model.CreateUserDto;
import com.grad.grad_proj.generated.api.model.ProfileResponseDto;
import com.grad.social.model.UserBasicData;
import com.grad.social.model.enums.Gender;
import com.grad.social.service.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController implements UsersApi {

    private final UserService userService;

    @Override
    public ResponseEntity<Void> signupUser(CreateUserDto createUserDto) {
        this.userService.createUser(createUserDto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Override
    @PreAuthorize("@SecurityService.hasUserLongId(authentication, #userId)")
    @SneakyThrows
    public ResponseEntity<Void> updateUser(Long userId, String displayName, LocalDate dob, String gender, String residence, String timezoneId, String profileBio, MultipartFile profilePicture, MultipartFile profileCoverPhoto) {
        UserBasicData userBasicData = UserBasicData.builder()
                .displayName(displayName)
                .dob(dob)
                .gender(Gender.valueOf(gender))
                .residence(residence)
                .timezoneId(timezoneId)
                .profileBio(profileBio)
                .build();
        this.userService.updateUser(userId, userBasicData, profilePicture, profileCoverPhoto);
        return ResponseEntity.ok().build();
    }

    @Override
    @PreAuthorize("permitAll()")
    public ResponseEntity<ProfileResponseDto> fetchUserAccountByName(String nameToSearch) {
        Long currentUserId = Long.parseLong(SecurityContextHolder.getContext().getAuthentication().getName());
        return ResponseEntity.ok(this.userService.fetchUserAccountByName(currentUserId, nameToSearch));
    }

}
