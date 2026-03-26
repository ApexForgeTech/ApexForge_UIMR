package com.uimr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class UimrApplication {
    public static void main(String[] args) {
        SpringApplication.run(UimrApplication.class, args);
    }
}
