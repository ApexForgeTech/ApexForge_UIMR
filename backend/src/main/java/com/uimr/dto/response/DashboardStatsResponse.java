package com.uimr.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data @Builder @AllArgsConstructor
public class DashboardStatsResponse {
    private long totalIncidents;
    private long openIncidents;
    private long inProgressIncidents;
    private long closedIncidents;
    private long criticalIncidents;
    private long incidentsToday;
    private Map<String, Long> byStatus;
    private Map<String, Long> bySeverity;
    private Map<String, Long> bySource;
}
