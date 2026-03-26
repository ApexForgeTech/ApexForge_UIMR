package com.uimr.controller;

import com.uimr.dto.response.TimelineEventResponse;
import com.uimr.service.TimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents/{incidentId}/timeline")
@RequiredArgsConstructor
public class TimelineController {

    private final TimelineService timelineService;

    @GetMapping
    public ResponseEntity<List<TimelineEventResponse>> getTimeline(@PathVariable Long incidentId) {
        return ResponseEntity.ok(timelineService.getTimeline(incidentId));
    }
}
