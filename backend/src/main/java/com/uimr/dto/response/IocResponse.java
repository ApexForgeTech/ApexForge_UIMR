package com.uimr.dto.response;

import com.uimr.model.enums.IocType;
import com.uimr.model.enums.TiStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor
public class IocResponse {
    private Long id;
    private Long incidentId;
    private IocType type;
    private String value;
    private TiStatus tiStatus;
    private String tiResultJson;
    private String addedByName;
    private LocalDateTime createdAt;
}
