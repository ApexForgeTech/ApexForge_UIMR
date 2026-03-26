package com.uimr.dto.request;

import com.uimr.model.enums.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateIncidentRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    private Severity severity;

    private IncidentSource source;
    private String sourceRef;
    private Long assigneeId;
    private Long teamId;
    private List<IocRequest> iocs;
}
