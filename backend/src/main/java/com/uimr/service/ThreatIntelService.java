package com.uimr.service;

import com.uimr.dto.response.IocResponse;
import com.uimr.exception.ResourceNotFoundException;
import com.uimr.model.Ioc;
import com.uimr.model.enums.IocType;
import com.uimr.model.enums.TiStatus;
import com.uimr.model.enums.TimelineEventType;
import com.uimr.repository.IocRepository;
import com.uimr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ThreatIntelService {

    private final IocRepository iocRepo;
    private final UserRepository userRepo;
    private final TimelineService timelineService;
    private final RestTemplate restTemplate;
    private final SystemSettingsService settingsService;

    private String getVtApiKey() {
        return settingsService.getSettingValue("ti.virustotal.api-key", "");
    }
    
    private String getVtBaseUrl() {
        return settingsService.getSettingValue("ti.virustotal.base-url", "https://www.virustotal.com/api/v3");
    }

    private String getAbuseIpDbApiKey() {
        return settingsService.getSettingValue("ti.abuseipdb.api-key", "");
    }

    private String getAbuseIpDbBaseUrl() {
        return settingsService.getSettingValue("ti.abuseipdb.base-url", "https://api.abuseipdb.com/api/v2");
    }



    public IocResponse checkIoc(Long iocId, String username) {
        Ioc ioc = iocRepo.findById(iocId)
                .orElseThrow(() -> new ResourceNotFoundException("IOC not found: " + iocId));

        Map<String, Object> results = new HashMap<>();
        TiStatus overallStatus = TiStatus.CLEAN;

        try {
            // Check VirusTotal
            if (!getVtApiKey().isEmpty()) {
                Map<String, Object> vtResult = checkVirusTotal(ioc);
                results.put("virustotal", vtResult);
                if (vtResult.containsKey("malicious") && (int) vtResult.get("malicious") > 0) {
                    overallStatus = TiStatus.MALICIOUS;
                } else if (vtResult.containsKey("suspicious") && (int) vtResult.get("suspicious") > 0) {
                    overallStatus = TiStatus.SUSPICIOUS;
                }
            }

            // Check AbuseIPDB for IPs
            if (!getAbuseIpDbApiKey().isEmpty() && ioc.getType() == IocType.IP) {
                Map<String, Object> abuseResult = checkAbuseIPDB(ioc.getValue());
                results.put("abuseipdb", abuseResult);
                if (abuseResult.containsKey("abuseConfidenceScore")) {
                    int score = (int) abuseResult.get("abuseConfidenceScore");
                    if (score > 75) overallStatus = TiStatus.MALICIOUS;
                    else if (score > 25) overallStatus = TiStatus.SUSPICIOUS;
                }
            }

            ioc.setTiStatus(overallStatus);
            ioc.setTiResultJson(results.toString());

        } catch (Exception e) {
            log.error("TI check failed for IOC {}: {}", iocId, e.getMessage());
            ioc.setTiStatus(TiStatus.ERROR);
            ioc.setTiResultJson("{\"error\": \"" + e.getMessage() + "\"}");
        }

        iocRepo.save(ioc);

        // Record in timeline
        var user = userRepo.findByUsername(username).orElse(null);
        timelineService.recordEvent(ioc.getIncident(), TimelineEventType.TI_CHECK,
                String.format("TI check on [%s] %s → %s", ioc.getType(), ioc.getValue(), ioc.getTiStatus()),
                user);

        return IocResponse.builder()
                .id(ioc.getId())
                .incidentId(ioc.getIncident().getId())
                .type(ioc.getType())
                .value(ioc.getValue())
                .tiStatus(ioc.getTiStatus())
                .tiResultJson(ioc.getTiResultJson())
                .createdAt(ioc.getCreatedAt())
                .build();
    }

    private Map<String, Object> checkVirusTotal(Ioc ioc) {
        String endpoint;
        switch (ioc.getType()) {
            case IP -> endpoint = getVtBaseUrl() + "/ip_addresses/" + ioc.getValue();
            case DOMAIN -> endpoint = getVtBaseUrl() + "/domains/" + ioc.getValue();
            case URL -> endpoint = getVtBaseUrl() + "/urls/" + Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(ioc.getValue().getBytes());
            case HASH_MD5, HASH_SHA1, HASH_SHA256 -> endpoint = getVtBaseUrl() + "/files/" + ioc.getValue();
            default -> { return Map.of("status", "unsupported_type"); }
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-apikey", getVtApiKey());
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(endpoint, HttpMethod.GET, entity, Map.class);
            if (response.getBody() != null && response.getBody().containsKey("data")) {
                Map data = (Map) response.getBody().get("data");
                Map attributes = (Map) data.get("attributes");
                if (attributes != null && attributes.containsKey("last_analysis_stats")) {
                    return (Map<String, Object>) attributes.get("last_analysis_stats");
                }
            }
        } catch (Exception e) {
            log.warn("VirusTotal check failed: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
        return Map.of("status", "no_data");
    }

    private Map<String, Object> checkAbuseIPDB(String ip) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Key", getAbuseIpDbApiKey());
        headers.set("Accept", "application/json");
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String url = getAbuseIpDbBaseUrl() + "/check?ipAddress=" + ip + "&maxAgeInDays=90";

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            if (response.getBody() != null && response.getBody().containsKey("data")) {
                return (Map<String, Object>) response.getBody().get("data");
            }
        } catch (Exception e) {
            log.warn("AbuseIPDB check failed: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
        return Map.of("status", "no_data");
    }
}
