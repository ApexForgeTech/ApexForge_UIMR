package com.uimr.controller;

import com.uimr.dto.request.IocRequest;
import com.uimr.dto.response.IocResponse;
import com.uimr.service.IocService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class IocController {

    private final IocService iocService;

    @GetMapping("/incidents/{incidentId}/iocs")
    public ResponseEntity<List<IocResponse>> getIocs(@PathVariable Long incidentId) {
        return ResponseEntity.ok(iocService.getIocsByIncident(incidentId));
    }

    @PostMapping("/incidents/{incidentId}/iocs")
    public ResponseEntity<IocResponse> addIoc(
            @PathVariable Long incidentId,
            @Valid @RequestBody IocRequest request,
            Authentication auth) {
        return ResponseEntity.ok(iocService.addIoc(incidentId, request, auth.getName()));
    }

    @DeleteMapping("/iocs/{iocId}")
    public ResponseEntity<Void> deleteIoc(@PathVariable Long iocId, Authentication auth) {
        iocService.deleteIoc(iocId, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
