package com.uimr.service;

import com.uimr.model.*;
import com.uimr.model.enums.TimelineEventType;
import com.uimr.repository.TimelineEventRepository;
import com.uimr.dto.response.TimelineEventResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimelineService {

    private final TimelineEventRepository timelineRepo;

    public void recordEvent(Incident incident, TimelineEventType type, String description, User user) {
        recordEvent(incident, type, description, null, user);
    }

    public void recordEvent(Incident incident, TimelineEventType type, String description,
                           String metadataJson, User user) {
        TimelineEvent event = TimelineEvent.builder()
                .incident(incident)
                .eventType(type)
                .description(description)
                .metadataJson(metadataJson)
                .user(user)
                .build();
        timelineRepo.save(event);
    }

    public List<TimelineEventResponse> getTimeline(Long incidentId) {
        return timelineRepo.findByIncidentIdOrderByCreatedAtAsc(incidentId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private TimelineEventResponse toResponse(TimelineEvent event) {
        return TimelineEventResponse.builder()
                .id(event.getId())
                .eventType(event.getEventType())
                .description(event.getDescription())
                .metadataJson(event.getMetadataJson())
                .userName(event.getUser() != null ? event.getUser().getFullName() : "System")
                .createdAt(event.getCreatedAt())
                .build();
    }
}
