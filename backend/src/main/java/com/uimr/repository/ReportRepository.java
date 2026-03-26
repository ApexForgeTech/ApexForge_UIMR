package com.uimr.repository;

import com.uimr.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByGeneratedByIdOrderByCreatedAtDesc(Long userId);
}
