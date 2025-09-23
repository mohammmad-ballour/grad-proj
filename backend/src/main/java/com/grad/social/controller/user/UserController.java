package com.grad.social.controller.user;

import com.grad.social.model.enums.Gender;
import com.grad.social.model.user.helper.UserBasicData;
import com.grad.social.model.user.request.CreateUser;
import com.grad.social.model.user.response.ProfileResponse;
import com.grad.social.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/users")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Void> signupUser(@Valid @RequestBody CreateUser createUser) {
        this.userService.createUser(createUser);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping(value = "/users/{userId}", produces = { "application/json" }, consumes = { "multipart/form-data" })
    @PreAuthorize("@SecurityService.hasUserLongId(authentication, #userId)")
    @SneakyThrows
    public ResponseEntity<Void> updateUser(
            @PathVariable("userId") Long userId,
            @Valid @RequestParam(value = "displayName") String displayName, @Valid @RequestParam(value = "dob") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dob,
            @Valid @RequestParam(value = "gender") String gender, @Valid @RequestParam(value = "residence") String residence,
            @Valid @RequestParam(value = "timezoneId") String timezoneId, @Valid @RequestParam(value = "profileBio") String profileBio,
            @RequestPart(value = "profilePicture") MultipartFile profilePicture, @RequestPart(value = "profileCoverPhoto") MultipartFile profileCoverPhoto
    ) {
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


    @GetMapping("/users/public/{nameToSearch}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ProfileResponse> fetchUserAccountByName(@PathVariable("nameToSearch") String nameToSearch) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        Long currentUserId = Long.parseLong(authentication.getToken().getClaimAsString("uid"));
        return ResponseEntity.ok(this.userService.fetchUserAccountByName(currentUserId, nameToSearch));
    }

}
