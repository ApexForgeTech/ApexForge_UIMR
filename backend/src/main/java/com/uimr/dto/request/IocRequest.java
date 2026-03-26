package com.uimr.dto.request;

import com.uimr.model.enums.IocType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IocRequest {
    @NotNull
    private IocType type;

    @NotBlank
    private String value;
}
