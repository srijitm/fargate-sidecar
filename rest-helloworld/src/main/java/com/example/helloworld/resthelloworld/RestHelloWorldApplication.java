package com.example.helloworld.resthelloworld;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

import java.util.Collection;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@SpringBootApplication
@RestController
public class RestHelloWorldApplication extends SpringBootServletInitializer {

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		 return application.sources(RestHelloWorldApplication.class);
	}
	public static void main(String[] args) {
		 SpringApplication.run(RestHelloWorldApplication.class, args);
	}

	@GetMapping("/hello")
	public Collection<String> sayHello() {
		return IntStream.range(0, 10).mapToObj(i -> "Hello number " + i).collect(Collectors.toList());
	}
}