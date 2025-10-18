package com.grad.social.model.status;

public record ModerationResult(
		/*
		 * severity 0,1,2 -> safe and appears as-is in users feeds severity 3 -> harmful,
		 * appears with a warning 'this may be harmful' and the user should consent to
		 * view it severity 4 -> sends a warning notification to the user, and if they
		 * continued to post other posts with severity = 4, restrict their account
		 * temporarily
		 */
		int severity, String category, String description) {
}