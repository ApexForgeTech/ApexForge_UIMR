package com.uimr.dto.request;

import com.uimr.model.enums.Classification;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CloseIncidentRequest {
    @NotNull
    private Classification classification;
    private String closingNotes;
}
