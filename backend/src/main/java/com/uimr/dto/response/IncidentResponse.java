package com.uimr.dto.response;

import com.uimr.model.enums.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor
public class IncidentResponse {
    private Long id;
    private String title;
    private String description;
    private Severity severity;
    private IncidentStatus status;
    private Classification classification;
    private IncidentSource source;
    private String sourceRef;
    private String assigneeName;
    private Long assigneeId;
    private String teamName;
    private Long teamId;
    private String createdByName;
    private int iocCount;
    private int noteCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime closedAt;
}
