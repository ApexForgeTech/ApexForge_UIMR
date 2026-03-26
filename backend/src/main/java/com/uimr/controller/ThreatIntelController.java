package com.uimr.controller;

import com.uimr.dto.response.IocResponse;
import com.uimr.service.ThreatIntelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ThreatIntelController {

    private final ThreatIntelService tiService;

    @PostMapping("/iocs/{iocId}/check-ti")
    public ResponseEntity<IocResponse> checkTi(@PathVariable Long iocId, Authentication auth) {
        return ResponseEntity.ok(tiService.checkIoc(iocId, auth.getName()));
    }
}
