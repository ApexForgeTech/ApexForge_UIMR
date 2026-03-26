package com.uimr.repository;

import com.uimr.model.PlaybookExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlaybookExecutionRepository extends JpaRepository<PlaybookExecution, Long> {
    List<PlaybookExecution> findByIncidentIdOrderByStartedAtDesc(Long incidentId);
}
