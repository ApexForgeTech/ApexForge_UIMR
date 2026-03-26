package com.uimr.controller;

import com.uimr.model.SystemSettings;
import com.uimr.service.SystemSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SystemSettingsController {

    private final SystemSettingsService settingsService;

    @GetMapping
    public ResponseEntity<List<SystemSettings>> getAllSettings() {
        return ResponseEntity.ok(settingsService.getAllSettings());
    }

    @PutMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemSettings> updateSetting(@RequestParam String key, @RequestParam String value) {
        return ResponseEntity.ok(settingsService.updateSetting(key, value));
    }

    @PostMapping("/bulk")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateBulkSettings(@RequestBody java.util.Map<String, String> payload) {
        payload.forEach(settingsService::updateSetting);
        return ResponseEntity.ok().build();
    }
}
