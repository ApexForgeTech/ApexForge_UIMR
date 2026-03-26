package com.uimr.config;

import com.uimr.dto.request.RegisterRequest;
import com.uimr.model.User;
import com.uimr.model.enums.Role;
import com.uimr.repository.UserRepository;
import com.uimr.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final AuthService authService;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            if (userRepository.count() == 0) {
                RegisterRequest admin = new RegisterRequest();
                admin.setUsername("admin");
                admin.setPassword("admin123");
                admin.setEmail("admin@uimr.local");
                admin.setFullName("System Administrator");
                
                authService.register(admin);
                
                // Set role to ADMIN since register defaults to USER
                User savedAdmin = userRepository.findByUsername("admin").orElseThrow();
                savedAdmin.setRole(Role.ADMIN);
                userRepository.save(savedAdmin);
                
                System.out.println("Default admin user created: admin / admin123");
            }
        };
    }
}
