package com.uimr.repository;

import com.uimr.model.Incident;
import com.uimr.model.enums.IncidentStatus;
import com.uimr.model.enums.Severity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    Page<Incident> findByStatus(IncidentStatus status, Pageable pageable);
    Page<Incident> findBySeverity(Severity severity, Pageable pageable);
    Page<Incident> findByAssigneeId(Long assigneeId, Pageable pageable);
    Page<Incident> findByTeamId(Long teamId, Pageable pageable);

    @Query("SELECT i FROM Incident i WHERE " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:severity IS NULL OR i.severity = :severity) AND " +
           "(:assigneeId IS NULL OR i.assignee.id = :assigneeId) AND " +
           "(:search IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Incident> findFiltered(
        @Param("status") IncidentStatus status,
        @Param("severity") Severity severity,
        @Param("assigneeId") Long assigneeId,
        @Param("search") String search,
        Pageable pageable
    );

    // Dashboard queries
    long countByStatus(IncidentStatus status);
    long countBySeverity(Severity severity);
    long countByCreatedAtAfter(LocalDateTime after);

    @Query("SELECT i.status, COUNT(i) FROM Incident i GROUP BY i.status")
    List<Object[]> countGroupByStatus();

    @Query("SELECT i.severity, COUNT(i) FROM Incident i GROUP BY i.severity")
    List<Object[]> countGroupBySeverity();

    @Query("SELECT i.source, COUNT(i) FROM Incident i GROUP BY i.source")
    List<Object[]> countGroupBySource();
}
