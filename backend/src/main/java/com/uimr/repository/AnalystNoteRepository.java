package com.uimr.repository;

import com.uimr.model.AnalystNote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnalystNoteRepository extends JpaRepository<AnalystNote, Long> {
    List<AnalystNote> findByIncidentIdOrderByCreatedAtDesc(Long incidentId);
}
