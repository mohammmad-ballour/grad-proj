package com.grad.social.common.security.firebase;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.grad.grad_proj.generated.api.model.SignInRequestDto;
import com.grad.social.common.exceptionhandling.ActionNotAllowedException;
import com.grad.social.common.security.AuthService;
import com.grad.social.exception.user.UserErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FirebaseAuthService implements AuthService {
    private final FirebaseAuth firebaseAuth;
    private final FirebaseAuthClient firebaseAuthClient;

    @Override
    public String createUserAccount(String userId, String email, String password) {
        UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                .setUid(userId)
                .setEmail(email)
                .setPassword(password)
                .setEmailVerified(false)
                .setDisabled(false);
        try {
            UserRecord userRecord = this.firebaseAuth.createUser(request);
            System.out.println("account created");
            return userRecord.getUid();
        } catch (FirebaseAuthException e) {
            throw new ActionNotAllowedException(UserErrorCode.CANNOT_CREATE_ACCOUNT);
        }
    }

    @Override
    public String loginWithPassword(SignInRequestDto signInRequestDto) throws BadCredentialsException {
        return this.firebaseAuthClient.login(signInRequestDto);
    }
}
