package com.grad.social.common.database.utils;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.stereotype.Component;

@Component
public class LanguageDetector {
    private final ChatClient chatClient;

    public LanguageDetector(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public String recognizeLanguage(String text) {
        return this.chatClient.prompt()
                .system("""
                            You are a language detector. 
                            You will be given a text and you must respond with the PostgreSQL full-text search language name 
                            that can be used in to_tsvector/to_tsquery, in lowercase. 
                        """)
                .user(text)
                .options(OllamaOptions.builder().withFormat("json").build())
                .call()
                .entity(StringResponse.class)
                .response();
    }

    record StringResponse(String response) {
    }

}
