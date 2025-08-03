package com.grad.social;

import com.grad.social.base.TestcontainersConfiguration;
import org.springframework.boot.SpringApplication;

public class TestSocialApplication {

	public static void main(String[] args) {
		SpringApplication.from(SocialApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
