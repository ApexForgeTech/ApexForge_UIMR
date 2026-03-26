package com.uimr.controller;

import com.uimr.model.User;
import com.uimr.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<Map<String, Object>> users = userService.getAllUsers().stream()
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "username", u.getUsername(),
                        "fullName", u.getFullName() != null ? u.getFullName() : u.getUsername(),
                        "email", u.getEmail(),
                        "role", u.getRole().name(),
                        "active", u.getActive()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
}
