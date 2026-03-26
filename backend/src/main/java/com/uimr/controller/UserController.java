package com.uimr.controller;

import com.uimr.model.User;
import com.uimr.model.enums.UserRole;
import com.uimr.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<Map<String, Object>> users = userService.getAllUsers().stream()
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "username", u.getUsername(),
                        "fullName", u.getFullName() != null ? u.getFullName() : u.getUsername(),
                        "email", u.getEmail(),
                        "role", u.getRole().name(),
                        "active", u.getActive(),
                        "createdAt", u.getCreatedAt().toString()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, String> req) {
        User user = User.builder()
                .username(req.get("username"))
                .email(req.get("email"))
                .fullName(req.get("fullName"))
                .passwordHash(passwordEncoder.encode(req.get("password")))
                .role(UserRole.valueOf(req.getOrDefault("role", "ANALYST")))
                .active(true)
                .build();
        User saved = userService.createUser(user);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "username", saved.getUsername()));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<Void> updateRole(@PathVariable("id") Long id, @RequestParam("role") UserRole role) {
        userService.updateRole(id, role);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<Void> toggleActive(@PathVariable("id") Long id) {
        userService.toggleActive(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
