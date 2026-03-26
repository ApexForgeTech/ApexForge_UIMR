package com.uimr.service;

import com.uimr.dto.request.*;
import com.uimr.dto.response.IncidentResponse;
import com.uimr.exception.ResourceNotFoundException;
import com.uimr.model.*;
import com.uimr.model.enums.*;
import com.uimr.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepo;
    private final UserRepository userRepo;
    private final TeamRepository teamRepo;
    private final IocRepository iocRepo;
    private final TimelineService timelineService;
    private final NotificationService notificationService;

    @Transactional
    public IncidentResponse createIncident(CreateIncidentRequest request, String username) {
        User creator = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Incident incident = Incident.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .severity(request.getSeverity())
                .source(request.getSource() != null ? request.getSource() : IncidentSource.MANUAL)
                .sourceRef(request.getSourceRef())
                .createdBy(creator)
                .build();

        if (request.getAssigneeId() != null) {
            User assignee = userRepo.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            incident.setAssignee(assignee);
        }

        if (request.getTeamId() != null) {
            Team team = teamRepo.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
            incident.setTeam(team);
        }

        incident = incidentRepo.save(incident);

        // Add IOCs if provided
        if (request.getIocs() != null) {
            for (IocRequest iocReq : request.getIocs()) {
                Ioc ioc = Ioc.builder()
                        .incident(incident)
                        .type(iocReq.getType())
                        .value(iocReq.getValue())
                        .addedBy(creator)
                        .build();
                iocRepo.save(ioc);
            }
        }

        // Record timeline
        timelineService.recordEvent(incident, TimelineEventType.CREATED,
                "Incident created by " + creator.getFullName(), creator);

        // Notify assignee
        if (incident.getAssignee() != null) {
            notificationService.notifyIncidentAssigned(incident, incident.getAssignee());
        }

        return toResponse(incident);
    }

    @Transactional
    public IncidentResponse updateIncident(Long id, UpdateIncidentRequest request, String username) {
        Incident incident = incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + id));
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getTitle() != null) {
            incident.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            incident.setDescription(request.getDescription());
        }
        if (request.getSeverity() != null && request.getSeverity() != incident.getSeverity()) {
            String old = incident.getSeverity().name();
            incident.setSeverity(request.getSeverity());
            timelineService.recordEvent(incident, TimelineEventType.SEVERITY_CHANGE,
                    "Severity changed from " + old + " to " + request.getSeverity(), user);
        }
        if (request.getStatus() != null && request.getStatus() != incident.getStatus()) {
            String old = incident.getStatus().name();
            incident.setStatus(request.getStatus());
            timelineService.recordEvent(incident, TimelineEventType.STATUS_CHANGE,
                    "Status changed from " + old + " to " + request.getStatus(), user);
            if (incident.getAssignee() != null) {
                notificationService.notifyIncidentStatusChange(incident, incident.getAssignee(), old, request.getStatus().name());
            }
        }
        if (request.getAssigneeId() != null) {
            User assignee = userRepo.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            incident.setAssignee(assignee);
            timelineService.recordEvent(incident, TimelineEventType.ASSIGNED,
                    "Assigned to " + assignee.getFullName(), user);
            notificationService.notifyIncidentAssigned(incident, assignee);
        }
        if (request.getTeamId() != null) {
            Team team = teamRepo.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
            incident.setTeam(team);
        }

        incident = incidentRepo.save(incident);
        return toResponse(incident);
    }

    @Transactional
    public IncidentResponse closeIncident(Long id, CloseIncidentRequest request, String username) {
        Incident incident = incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + id));
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        incident.setStatus(IncidentStatus.CLOSED);
        incident.setClassification(request.getClassification());
        incident.setClosedAt(LocalDateTime.now());

        String desc = String.format("Incident closed as %s by %s", request.getClassification(), user.getFullName());
        if (request.getClosingNotes() != null) {
            desc += ". Notes: " + request.getClosingNotes();
        }
        timelineService.recordEvent(incident, TimelineEventType.CLOSED, desc, user);

        incident = incidentRepo.save(incident);
        return toResponse(incident);
    }

    public IncidentResponse getIncident(Long id) {
        Incident incident = incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + id));
        return toResponse(incident);
    }

    public Page<IncidentResponse> getIncidents(IncidentStatus status, Severity severity,
                                                Long assigneeId, String search, Pageable pageable) {
        return incidentRepo.findFiltered(status, severity, assigneeId, search, pageable)
                .map(this::toResponse);
    }

    public IncidentResponse toResponse(Incident i) {
        return IncidentResponse.builder()
                .id(i.getId())
                .title(i.getTitle())
                .description(i.getDescription())
                .severity(i.getSeverity())
                .status(i.getStatus())
                .classification(i.getClassification())
                .source(i.getSource())
                .sourceRef(i.getSourceRef())
                .assigneeName(i.getAssignee() != null ? i.getAssignee().getFullName() : null)
                .assigneeId(i.getAssignee() != null ? i.getAssignee().getId() : null)
                .teamName(i.getTeam() != null ? i.getTeam().getName() : null)
                .teamId(i.getTeam() != null ? i.getTeam().getId() : null)
                .createdByName(i.getCreatedBy().getFullName())
                .iocCount(i.getIocs() != null ? i.getIocs().size() : 0)
                .noteCount(i.getNotes() != null ? i.getNotes().size() : 0)
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .closedAt(i.getClosedAt())
                .build();
    }
}
