package com.grad.social.repository;

import com.grad.graduation_project.generated.api.model.CreateUserDto;
import com.grad.social.base.BaseRepositoryTest;
import com.grad.social.model.tables.records.UsersRecord;
import com.grad.social.repository.user.UserRepository;
import com.grad.social.testdata.user.UserTestDate;
import org.jooq.DSLContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import static com.grad.social.model.tables.Users.USERS;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@Import({UserRepository.class})
class UserRepositoryTest extends BaseRepositoryTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    DSLContext dsl;

    @Test
    void save() {
        // given
        CreateUserDto dto = UserTestDate.validCreateUserDto();

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
        assertThat(record.get(USERS.GENDER).name()).isEqualTo(dto.getGender().name());
        assertThat(record.get(USERS.DOB)).isEqualTo(dto.getDob());
        assertThat(record.get(USERS.RESIDENCE)).isEqualTo(dto.getResidence());
        assertThat(record.get(USERS.TIMEZONE_ID)).isEqualTo(dto.getTimezoneId());
    }

}

