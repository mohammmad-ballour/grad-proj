package com.grad.social.common.utils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

import static java.time.ZoneOffset.UTC;

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

    public static Instant localDateToInstant(LocalDate localDate) {
        return localDate.atStartOfDay(UTC).toInstant();
    }

    public static LocalDate stringToLocaldate(String timestamp) {
        return Instant.parse(timestamp).atZone(UTC).toLocalDate();
    }

    public static Instant stringToInstant(String timestamp) {
        return Instant.parse(timestamp);
    }
}