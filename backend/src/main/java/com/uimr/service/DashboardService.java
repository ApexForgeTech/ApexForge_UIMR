package com.uimr.service;

import com.uimr.dto.response.DashboardStatsResponse;
import com.uimr.model.enums.IncidentStatus;
import com.uimr.model.enums.Severity;
import com.uimr.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final IncidentRepository incidentRepo;

    public DashboardStatsResponse getStats() {
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Object[] row : incidentRepo.countGroupByStatus()) {
            byStatus.put(row[0].toString(), (Long) row[1]);
        }

        Map<String, Long> bySeverity = new LinkedHashMap<>();
        for (Object[] row : incidentRepo.countGroupBySeverity()) {
            bySeverity.put(row[0].toString(), (Long) row[1]);
        }

        Map<String, Long> bySource = new LinkedHashMap<>();
        for (Object[] row : incidentRepo.countGroupBySource()) {
            bySource.put(row[0].toString(), (Long) row[1]);
        }

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        return DashboardStatsResponse.builder()
                .totalIncidents(incidentRepo.count())
                .openIncidents(incidentRepo.countByStatus(IncidentStatus.OPEN))
                .inProgressIncidents(incidentRepo.countByStatus(IncidentStatus.IN_PROGRESS))
                .closedIncidents(incidentRepo.countByStatus(IncidentStatus.CLOSED))
                .criticalIncidents(incidentRepo.countBySeverity(Severity.CRITICAL))
                .incidentsToday(incidentRepo.countByCreatedAtAfter(startOfDay))
                .byStatus(byStatus)
                .bySeverity(bySeverity)
                .bySource(bySource)
                .build();
    }
}
