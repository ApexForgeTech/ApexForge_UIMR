package com.uimr.controller;

import com.uimr.dto.request.CreateIncidentRequest;
import com.uimr.model.enums.IncidentSource;
import com.uimr.model.enums.Severity;
import com.uimr.service.IncidentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ingest")
@RequiredArgsConstructor
@Slf4j
public class IngestionController {

    private final IncidentService incidentService;

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> receiveWebhook(@RequestBody Map<String, Object> payload) {
        log.info("Received webhook: {}", payload);

        CreateIncidentRequest request = new CreateIncidentRequest();
        request.setTitle(payload.getOrDefault("title", "Ingested Alert").toString());
        request.setDescription(payload.getOrDefault("description", "").toString());
        request.setSource(parseSource(payload.getOrDefault("source", "API").toString()));
        request.setSeverity(parseSeverity(payload.getOrDefault("severity", "MEDIUM").toString()));
        request.setSourceRef(payload.getOrDefault("source_ref", "").toString());

        // Use system user for ingested incidents
        incidentService.createIncident(request, "admin");

        return ResponseEntity.ok(Map.of("status", "accepted"));
    }

    @PostMapping("/syslog")
    public ResponseEntity<Map<String, String>> receiveSyslog(@RequestBody String rawMessage) {
        log.info("Received syslog: {}", rawMessage);

        CreateIncidentRequest request = new CreateIncidentRequest();
        request.setTitle("Syslog Alert");
        request.setDescription(rawMessage);
        request.setSource(IncidentSource.SYSLOG);
        request.setSeverity(Severity.MEDIUM);

        incidentService.createIncident(request, "admin");

        return ResponseEntity.ok(Map.of("status", "accepted"));
    }

    private IncidentSource parseSource(String source) {
        try { return IncidentSource.valueOf(source.toUpperCase()); }
        catch (Exception e) { return IncidentSource.API; }
    }

    private Severity parseSeverity(String severity) {
        try { return Severity.valueOf(severity.toUpperCase()); }
        catch (Exception e) { return Severity.MEDIUM; }
    }
}
