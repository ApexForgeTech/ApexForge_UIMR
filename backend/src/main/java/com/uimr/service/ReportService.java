package com.uimr.service;

import com.uimr.dto.request.ReportRequest;
import com.uimr.exception.ResourceNotFoundException;
import com.uimr.model.Report;
import com.uimr.model.User;
import com.uimr.model.enums.ReportStatus;
import com.uimr.repository.ReportRepository;
import com.uimr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepo;
    private final UserRepository userRepo;

    public List<Report> getUserReports(String username) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return reportRepo.findByGeneratedByIdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional
    public Report createReport(ReportRequest request, String username) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Report report = Report.builder()
                .name(request.getName())
                .type(request.getType())
                .format(request.getFormat())
                .status(ReportStatus.GENERATING)
                .generatedBy(user)
                .build();

        report = reportRepo.save(report);

        // Simulate async generation
        Long reportId = report.getId();
        CompletableFuture.runAsync(() -> generateMockReport(reportId));

        return report;
    }

    private void generateMockReport(Long reportId) {
        try {
            Thread.sleep(5000); // Simulate processing
            Report report = reportRepo.findById(reportId).orElseThrow();
            report.setStatus(ReportStatus.READY);
            report.setFileUrl("/api/reports/download/" + reportId);
            reportRepo.save(report);
            log.info("Report {} generated successfully", reportId);
        } catch (Exception e) {
            log.error("Report generation failed: {}", e.getMessage());
            reportRepo.findById(reportId).ifPresent(r -> {
                r.setStatus(ReportStatus.FAILED);
                reportRepo.save(r);
            });
        }
    }

    public Report getReport(Long id) {
        return reportRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + id));
    }
}
