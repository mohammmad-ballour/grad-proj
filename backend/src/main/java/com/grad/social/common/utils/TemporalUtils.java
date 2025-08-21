package com.grad.social.common.utils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

public class TemporalUtils {
    private static final ZoneId UTC = ZoneId.of("UTC");
    public static Instant addHours(Instant instant, long hours) {
        return instant.plus(hours, ChronoUnit.HOURS);
    }

    public static Instant addDays(Instant instant, long days) {
        return instant.atZone(UTC)
                .plusDays(days)
                .toInstant();
    }

    public static Instant addMonths(Instant instant, long months) {
        return instant.atZone(UTC)
                .plusMonths(months)
                .toInstant();
    }

    public static Instant addYears(Instant instant, long years) {
        return instant.atZone(UTC)
                .plusYears(years)
                .toInstant();
    }

}