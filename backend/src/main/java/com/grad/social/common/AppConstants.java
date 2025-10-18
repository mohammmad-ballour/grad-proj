package com.grad.social.common;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

public final class AppConstants {

	public static final String UPLOAD_DIR = "uploads";

	public static final int DEFAULT_STRING_MAX_LENGTH = 100;

	public static final LocalDate DEFAULT_MAX_DATE = LocalDate.of(4000, 1, 1);
	public static final LocalDate DEFAULT_MIN_DATE = LocalDate.of(2000, 1, 1);

	public static final Instant DEFAULT_MAX_TIMESTAMP = DEFAULT_MAX_DATE.atStartOfDay().toInstant(ZoneOffset.UTC);
	public static final Instant DEFAULT_MIN_TIMESTAMP = DEFAULT_MIN_DATE.atStartOfDay().toInstant(ZoneOffset.UTC);

	public static final int DEFAULT_PAGE_SIZE = 10;

    public static final double MODERATION_THRESHOLD = 0.25;

}
