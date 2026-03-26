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
    private final com.uimr.service.IocService iocService;

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

        com.uimr.dto.response.IncidentResponse created = incidentService.createIncident(request, "admin");
        extractAndAddIocs(rawMessage, created.getId());

        return ResponseEntity.ok(Map.of("status", "accepted", "incidentId", created.getId().toString()));
    }

    private void extractAndAddIocs(String text, Long incidentId) {
        java.util.regex.Matcher ipMatcher = java.util.regex.Pattern.compile("\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b").matcher(text);
        while (ipMatcher.find()) {
            try {
                com.uimr.dto.request.IocRequest iocReq = new com.uimr.dto.request.IocRequest();
                iocReq.setType(com.uimr.model.enums.IocType.IP);
                iocReq.setValue(ipMatcher.group());
                iocService.addIoc(incidentId, iocReq, "admin");
            } catch(Exception e) { /* ignore duplicates */ }
        }

        java.util.regex.Matcher urlMatcher = java.util.regex.Pattern.compile("https?://[-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|]").matcher(text);
        while (urlMatcher.find()) {
            try {
                com.uimr.dto.request.IocRequest iocReq = new com.uimr.dto.request.IocRequest();
                iocReq.setType(com.uimr.model.enums.IocType.URL);
                iocReq.setValue(urlMatcher.group());
                iocService.addIoc(incidentId, iocReq, "admin");
            } catch(Exception e) { /* ignore duplicates */ }
        }
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
