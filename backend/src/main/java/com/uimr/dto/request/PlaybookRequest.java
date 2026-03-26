package com.uimr.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PlaybookRequest {
    @NotBlank
    private String name;
    private String description;
    private String stepsJson;
    private String soarEndpoint;
}
