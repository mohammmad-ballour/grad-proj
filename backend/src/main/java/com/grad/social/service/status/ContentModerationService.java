package com.grad.social.service.status;

import com.grad.social.common.AppConstants;
import com.grad.social.common.database.utils.LanguageDetector;
import com.grad.social.model.status.ModerationResult;
import com.grad.social.repository.status.StatusRepository;
import com.grad.social.service.status.event.StatusPublishedEvent;
import com.grad.social.service.status.event.StatusContentUpdatedEvent;
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

    @Async
    @EventListener(StatusContentUpdatedEvent.class)
    public void moderateUpdatedStatus(StatusContentUpdatedEvent event) {
        if (!isSignificantChange(event.oldContent(), event.newContent())) return;
        var moderationResult = constructModerationResult(event.newContent());
        this.statusRepository.saveContentModeration(event.statusId(), moderationResult);
    }

    private ModerationResult constructModerationResult(String content) {
        return this.chatClient.prompt()
                .system(systemMessageResource)
                .user(content)
                .options(OllamaOptions.builder().withFormat("json").build())
                .call()
                .entity(ModerationResult.class);
    }

    private boolean isSignificantChange(String oldContent, String newContent) {
        if (oldContent == null || newContent == null) return true;

        int distance = levenshteinDistance(oldContent, newContent);
        double relativeChange = (double) distance / oldContent.length();

        return relativeChange >= AppConstants.MODERATION_THRESHOLD;
    }


    private int levenshteinDistance(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];

        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;

        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(
                            dp[i - 1][j - 1], // substitution
                            Math.min(
                                    dp[i - 1][j], // deletion
                                    dp[i][j - 1]  // insertion
                            )
                    );
                }
            }
        }

        return dp[a.length()][b.length()];
    }


}
