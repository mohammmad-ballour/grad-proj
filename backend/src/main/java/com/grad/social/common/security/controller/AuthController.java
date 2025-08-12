package com.grad.social.common.security.controller;

import com.grad.grad_proj.generated.api.model.SignInRequestDto;
import com.grad.social.common.security.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/auth/login")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> login(@Valid @RequestBody SignInRequestDto signInRequestDto) {
        return ResponseEntity.ok(this.authService.loginWithPassword(signInRequestDto));
    }

}
