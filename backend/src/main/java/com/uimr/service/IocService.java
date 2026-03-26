package com.uimr.service;

import com.uimr.dto.request.IocRequest;
import com.uimr.dto.response.IocResponse;
import com.uimr.exception.ResourceNotFoundException;
import com.uimr.model.*;
import com.uimr.model.enums.TimelineEventType;
import com.uimr.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IocService {

    private final IocRepository iocRepo;
    private final IncidentRepository incidentRepo;
    private final UserRepository userRepo;
    private final TimelineService timelineService;

    @Transactional
    public IocResponse addIoc(Long incidentId, IocRequest request, String username) {
        Incident incident = incidentRepo.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + incidentId));
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (iocRepo.existsByIncidentIdAndValue(incidentId, request.getValue())) {
            throw new IllegalArgumentException("IOC already exists for this incident");
        }

        Ioc ioc = Ioc.builder()
                .incident(incident)
                .type(request.getType())
                .value(request.getValue())
                .addedBy(user)
                .build();

        ioc = iocRepo.save(ioc);

        timelineService.recordEvent(incident, TimelineEventType.IOC_ADDED,
                String.format("IOC added: [%s] %s", request.getType(), request.getValue()), user);

        return toResponse(ioc);
    }

    public List<IocResponse> getIocsByIncident(Long incidentId) {
        return iocRepo.findByIncidentId(incidentId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteIoc(Long iocId, String username) {
        Ioc ioc = iocRepo.findById(iocId)
                .orElseThrow(() -> new ResourceNotFoundException("IOC not found: " + iocId));
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        timelineService.recordEvent(ioc.getIncident(), TimelineEventType.IOC_REMOVED,
                String.format("IOC removed: [%s] %s", ioc.getType(), ioc.getValue()), user);

        iocRepo.delete(ioc);
    }

    public IocResponse toResponse(Ioc ioc) {
        return IocResponse.builder()
                .id(ioc.getId())
                .incidentId(ioc.getIncident().getId())
                .type(ioc.getType())
                .value(ioc.getValue())
                .tiStatus(ioc.getTiStatus())
                .tiResultJson(ioc.getTiResultJson())
                .addedByName(ioc.getAddedBy() != null ? ioc.getAddedBy().getFullName() : null)
                .createdAt(ioc.getCreatedAt())
                .build();
    }
}
