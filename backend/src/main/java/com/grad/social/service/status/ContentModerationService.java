package com.grad.social.service.status;

import com.grad.social.common.database.utils.LanguageDetector;
import com.grad.social.model.status.ModerationResult;
import com.grad.social.repository.status.StatusRepository;
import com.grad.social.service.status.event.StatusPublishedEvent;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class ContentModerationService {

	private final ChatClient chatClient;
	private final Resource systemMessageResource;
	private final StatusRepository statusRepository;
    private final LanguageDetector languageDetector;

    public ContentModerationService(ChatClient.Builder chatClientBuilder, StatusRepository statusRepository,
                                    @Value("classpath:/prompts/system-message.st") Resource systemMessageResource, LanguageDetector languageDetector) {
		this.chatClient = chatClientBuilder.build();
		this.systemMessageResource = systemMessageResource;
		this.statusRepository = statusRepository;
        this.languageDetector = languageDetector;
    }

    @Async
	@EventListener(StatusPublishedEvent.class)
	public void moderate(StatusPublishedEvent event) {
        String content = event.content();
        var moderationResult = constructModerationResult(content);
        this.statusRepository.saveContentModeration(event.statusId(), moderationResult);

        String lang = languageDetector.recognizeLanguage(content);
        this.statusRepository.updateTsVector(event.statusId(), lang, content);
    }

   private ModerationResult constructModerationResult(String content) {
        return this.chatClient.prompt()
                .system(systemMessageResource)
                .user(content)
                .options(OllamaOptions.builder().withFormat("json").build())
                .call()
                .entity(ModerationResult.class);
    }

}
