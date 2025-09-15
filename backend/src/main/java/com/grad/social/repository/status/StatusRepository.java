package com.grad.social.repository.status;

import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class StatusRepository {
    private final DSLContext dsl;
}
