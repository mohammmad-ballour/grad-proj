package com.grad.social.repository;

import com.grad.social.base.BaseRepositoryTest;
import com.grad.social.model.tables.records.UsersRecord;
import com.grad.social.repository.user.UserRepository;
import com.grad.social.testdata.user.UserTestDate;
import org.jooq.DSLContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.jdbc.Sql;

import static com.grad.social.model.tables.Users.USERS;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@Import({UserRepository.class})
@Sql("classpath:/repository/users-test-data.sql")
class UserRepositoryTest extends BaseRepositoryTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    DSLContext dsl;

    @Test
    void save() {
        // given
        var dto = UserTestDate.validCreateUser();

        // when
        Long userId = userRepository.save(dto);

        // then
        assertThat(userId).isNotNull();

        UsersRecord record = dsl.selectFrom(USERS)
                .where(USERS.ID.eq(userId))
                .fetchOne();

        assertThat(record).isNotNull();
        assertThat(record.get(USERS.EMAIL)).isEqualTo(dto.getEmail());
        assertThat(record.get(USERS.USERNAME)).isEqualTo(dto.getUsername());
        assertThat(record.get(USERS.DISPLAY_NAME)).isEqualTo(dto.getUsername());
        assertThat(record.get(USERS.GENDER).name()).isEqualTo(dto.getGender());
        assertThat(record.get(USERS.DOB)).isEqualTo(dto.getDob());
        assertThat(record.get(USERS.RESIDENCE)).isEqualTo(dto.getResidence());
        assertThat(record.get(USERS.TIMEZONE_ID)).isEqualTo(dto.getTimezoneId());
    }

}

