package com.uimr.dto.response;

import com.uimr.model.enums.TimelineEventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor
public class TimelineEventResponse {
    private Long id;
    private TimelineEventType eventType;
    private String description;
    private String metadataJson;
    private String userName;
    private LocalDateTime createdAt;
}
