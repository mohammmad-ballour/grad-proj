package com.grad.social.model.status.request;

import java.util.List;

public record UpdateStatusContent(String newContent, List<Long> keepMediaIds, List<Long> removeMediaIds) {
}