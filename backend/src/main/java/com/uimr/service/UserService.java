package com.uimr.service;

import com.uimr.model.User;
import com.uimr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateRole(Long id, com.uimr.model.enums.UserRole role) {
        User user = userRepository.findById(id).orElseThrow();
        user.setRole(role);
        return userRepository.save(user);
    }

    public User toggleActive(Long id) {
        User user = userRepository.findById(id).orElseThrow();
        user.setActive(!user.getActive());
        return userRepository.save(user);
    }
}
