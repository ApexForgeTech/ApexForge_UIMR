package com.uimr.service;

import com.uimr.dto.request.PlaybookRequest;
import com.uimr.exception.ResourceNotFoundException;
import com.uimr.model.*;
import com.uimr.model.enums.*;
import com.uimr.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlaybookService {

    private final PlaybookRepository playbookRepo;
    private final PlaybookExecutionRepository execRepo;
    private final IncidentRepository incidentRepo;
    private final UserRepository userRepo;
    private final TimelineService timelineService;
    private final RestTemplate restTemplate;
    private final SystemSettingsService settingsService;

    private String getSoarBaseUrl() {
        return settingsService.getSettingValue("soar.base-url", "http://localhost:9000");
    }

    private String getSoarApiKey() {
        return settingsService.getSettingValue("soar.api-key", "");
    }

    public Playbook createPlaybook(PlaybookRequest request, String username) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Playbook playbook = Playbook.builder()
                .name(request.getName())
                .description(request.getDescription())
                .stepsJson(request.getStepsJson())
                .soarEndpoint(request.getSoarEndpoint())
                .createdBy(user)
                .build();

        return playbookRepo.save(playbook);
    }

    public List<Playbook> getAllPlaybooks() {
        return playbookRepo.findAll();
    }

    @Transactional
    public PlaybookExecution executePlaybook(Long playbookId, Long incidentId, String username) {
        Playbook playbook = playbookRepo.findById(playbookId)
                .orElseThrow(() -> new ResourceNotFoundException("Playbook not found"));
        Incident incident = incidentRepo.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        PlaybookExecution execution = PlaybookExecution.builder()
                .playbook(playbook)
                .incident(incident)
                .triggeredBy(user)
                .status(PlaybookStatus.RUNNING)
                .build();

        execution = execRepo.save(execution);

        // Record timeline
        timelineService.recordEvent(incident, TimelineEventType.PLAYBOOK_RUN,
                "Playbook '" + playbook.getName() + "' executed by " + user.getFullName(), user);

        // Execute SOAR if endpoint configured
        if (playbook.getSoarEndpoint() != null && !playbook.getSoarEndpoint().isEmpty()) {
            try {
                String url = getSoarBaseUrl() + playbook.getSoarEndpoint();
                Map<String, Object> payload = Map.of(
                        "incident_id", incident.getId(),
                        "incident_title", incident.getTitle(),
                        "playbook_id", playbook.getId(),
                        "execution_id", execution.getId()
                );
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                if (!getSoarApiKey().isEmpty()) {
                    headers.set("Authorization", "Bearer " + getSoarApiKey());
                }
                org.springframework.http.HttpEntity<Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(payload, headers);
                var result = restTemplate.postForObject(url, entity, String.class);
                execution.setStatus(PlaybookStatus.SUCCESS);
                execution.setResultJson(result);
            } catch (Exception e) {
                log.error("SOAR execution failed: {}", e.getMessage());
                execution.setStatus(PlaybookStatus.FAILED);
                execution.setResultJson("{\"error\": \"" + e.getMessage() + "\"}");
            }
        } else {
            execution.setStatus(PlaybookStatus.SUCCESS);
            execution.setResultJson("{\"message\": \"No SOAR endpoint configured, manual execution logged\"}");
        }

        execution.setCompletedAt(LocalDateTime.now());
        return execRepo.save(execution);
    }

    public List<PlaybookExecution> getExecutions(Long incidentId) {
        return execRepo.findByIncidentIdOrderByStartedAtDesc(incidentId);
    }
}
