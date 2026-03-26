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
            @RequestParam(value = "status", required = false) IncidentStatus status,
            @RequestParam(value = "severity", required = false) Severity severity,
            @RequestParam(value = "assigneeId", required = false) Long assigneeId,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(incidentService.getIncidents(status, severity, assigneeId, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentResponse> getIncident(@PathVariable("id") Long id) {
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
            @PathVariable("id") Long id,
            @RequestBody UpdateIncidentRequest request,
            Authentication auth) {
        return ResponseEntity.ok(incidentService.updateIncident(id, request, auth.getName()));
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<IncidentResponse> closeIncident(
            @PathVariable("id") Long id,
            @Valid @RequestBody CloseIncidentRequest request,
            Authentication auth) {
        return ResponseEntity.ok(incidentService.closeIncident(id, request, auth.getName()));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<IncidentResponse> assignIncident(
            @PathVariable("id") Long id,
            @RequestBody UpdateIncidentRequest request,
            Authentication auth) {
        return ResponseEntity.ok(incidentService.updateIncident(id, request, auth.getName()));
    }
}
