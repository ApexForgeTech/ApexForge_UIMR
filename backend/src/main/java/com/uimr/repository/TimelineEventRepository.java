package com.uimr.repository;

import com.uimr.model.TimelineEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TimelineEventRepository extends JpaRepository<TimelineEvent, Long> {
    List<TimelineEvent> findByIncidentIdOrderByCreatedAtAsc(Long incidentId);
}
