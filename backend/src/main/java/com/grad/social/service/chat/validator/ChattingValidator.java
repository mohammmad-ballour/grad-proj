package com.grad.social.service.chat.validator;

import com.grad.social.common.validation.ValidationErrorCollector;
import com.grad.social.exception.chat.ChattingErrorCode;
import com.grad.social.model.chat.request.CreateMessageRequest;
import lombok.Getter;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
@Getter
public class ChattingValidator {
    private final ValidationErrorCollector errorCollector = new ValidationErrorCollector();

    public void validateCreateMessage(CreateMessageRequest createMessageRequest, MultipartFile attachment) {
        if (!hasContent(createMessageRequest, attachment)) {
            errorCollector.add(ChattingErrorCode.MESSAGE_BODY_REQUIRED);
        }
        this.errorCollector.throwIfErrorsExist();
    }

    private boolean hasContent(CreateMessageRequest toCreate, MultipartFile mediaFile) {
        boolean hasText = toCreate.content() != null && !toCreate.content().trim().isEmpty();
        boolean hasMedia = mediaFile != null && !mediaFile.isEmpty();
        return hasText || hasMedia;
    }
}
