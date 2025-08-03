package com.grad.social.common.security.controller;

import com.grad.grad_proj.generated.api.AuthApi;
import com.grad.grad_proj.generated.api.model.*;
import com.grad.social.common.security.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController implements AuthApi {

    private final AuthService authService;

    @Override
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> login(SignInRequestDto signInRequestDto) {
        return ResponseEntity.ok(this.authService.loginWithPassword(signInRequestDto));
    }

}
