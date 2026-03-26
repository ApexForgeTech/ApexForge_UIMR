package com.uimr.controller;

import com.uimr.dto.request.PlaybookRequest;
import com.uimr.model.Playbook;
import com.uimr.model.PlaybookExecution;
import com.uimr.service.PlaybookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/playbooks")
@RequiredArgsConstructor
public class PlaybookController {

    private final PlaybookService playbookService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getPlaybooks() {
        List<Map<String, Object>> result = playbookService.getAllPlaybooks().stream()
                .map(p -> Map.<String, Object>of(
                        "id", p.getId(),
                        "name", p.getName(),
                        "description", p.getDescription() != null ? p.getDescription() : "",
                        "soarEndpoint", p.getSoarEndpoint() != null ? p.getSoarEndpoint() : "",
                        "createdAt", p.getCreatedAt().toString()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createPlaybook(
            @Valid @RequestBody PlaybookRequest request,
            Authentication auth) {
        Playbook p = playbookService.createPlaybook(request, auth.getName());
        return ResponseEntity.ok(Map.of(
                "id", p.getId(),
                "name", p.getName(),
                "description", p.getDescription() != null ? p.getDescription() : "",
                "createdAt", p.getCreatedAt().toString()
        ));
    }

    @PostMapping("/{playbookId}/execute")
    public ResponseEntity<Map<String, Object>> execute(
            @PathVariable("playbookId") Long playbookId,
            @RequestParam("incidentId") Long incidentId,
            Authentication auth) {
        PlaybookExecution exec = playbookService.executePlaybook(playbookId, incidentId, auth.getName());
        return ResponseEntity.ok(Map.of(
                "id", exec.getId(),
                "status", exec.getStatus().name(),
                "resultJson", exec.getResultJson() != null ? exec.getResultJson() : "",
                "startedAt", exec.getStartedAt().toString(),
                "completedAt", exec.getCompletedAt() != null ? exec.getCompletedAt().toString() : ""
        ));
    }

    @GetMapping("/executions/{incidentId}")
    public ResponseEntity<List<Map<String, Object>>> getExecutions(@PathVariable("incidentId") Long incidentId) {
        List<Map<String, Object>> result = playbookService.getExecutions(incidentId).stream()
                .map(e -> Map.<String, Object>of(
                        "id", e.getId(),
                        "playbookName", e.getPlaybook().getName(),
                        "status", e.getStatus().name(),
                        "triggeredBy", e.getTriggeredBy().getFullName(),
                        "startedAt", e.getStartedAt().toString(),
                        "completedAt", e.getCompletedAt() != null ? e.getCompletedAt().toString() : ""
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
