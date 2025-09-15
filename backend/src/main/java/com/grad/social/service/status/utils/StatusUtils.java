package com.grad.social.service.status.utils;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class StatusUtils {

    public static List<String> extractMentions(String content) {
        final Pattern MENTION_PATTERN = Pattern.compile("@([A-Za-z0-9_]{1,15})");
        Matcher matcher = MENTION_PATTERN.matcher(content);
        List<String> usernames = new ArrayList<>();
        while (matcher.find()) {
            usernames.add(matcher.group(1)); // capture username after "@"
        }
        return usernames;
    }
}