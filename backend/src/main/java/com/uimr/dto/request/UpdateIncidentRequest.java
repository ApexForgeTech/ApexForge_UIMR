package com.uimr.dto.request;

import com.uimr.model.enums.*;
import lombok.Data;

@Data
public class UpdateIncidentRequest {
    private String title;
    private String description;
    private Severity severity;
    private IncidentStatus status;
    private Long assigneeId;
    private Long teamId;
}
