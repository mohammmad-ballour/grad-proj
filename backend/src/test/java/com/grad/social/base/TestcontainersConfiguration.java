package com.grad.social.base;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Collections;

@TestConfiguration(proxyBeanMethods = false)
@Testcontainers
public class TestcontainersConfiguration {
	@Container
	static PostgreSQLContainer<?> postgreSQLContainer = new PostgreSQLContainer<>("postgres:17-alpine")
			.withDatabaseName("test-db")
			.withUsername("postgres")
			.withPassword("secret")
			.withCreateContainerCmdModifier(cmd -> cmd.getHostConfig().withTmpFs(Collections.singletonMap("/var/lib/postgresql/data","rw")));

	@Bean
	@ServiceConnection
	PostgreSQLContainer<?> pgContainer() {
		return postgreSQLContainer;
	}

}
