package com.uimr.controller;

import com.uimr.dto.request.*;
import com.uimr.dto.response.IncidentResponse;
import com.uimr.model.enums.*;
import com.uimr.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;

    @GetMapping
    public ResponseEntity<Page<IncidentResponse>> getIncidents(
            @RequestParam(required = false) IncidentStatus status,
            @RequestParam(required = false) Severity severity,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(incidentService.getIncidents(status, severity, assigneeId, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentResponse> getIncident(@PathVariable Long id) {
        return ResponseEntity.ok(incidentService.getIncident(id));
    }

    @PostMapping
    public ResponseEntity<IncidentResponse> createIncident(
            @Valid @RequestBody CreateIncidentRequest request,
            Authentication auth) {
        return ResponseEntity.ok(incidentService.createIncident(request, auth.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IncidentResponse> updateIncident(
            @PathVariable Long id,
            @RequestBody UpdateIncidentRequest request,
            Authentication auth) {
        return ResponseEntity.ok(incidentService.updateIncident(id, request, auth.getName()));
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<IncidentResponse> closeIncident(
            @PathVariable Long id,
            @Valid @RequestBody CloseIncidentRequest request,
            Authentication auth) {
        return ResponseEntity.ok(incidentService.closeIncident(id, request, auth.getName()));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<IncidentResponse> assignIncident(
            @PathVariable Long id,
            @RequestBody UpdateIncidentRequest request,
            Authentication auth) {
        return ResponseEntity.ok(incidentService.updateIncident(id, request, auth.getName()));
    }
}
