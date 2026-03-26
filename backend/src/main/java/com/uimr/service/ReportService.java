package com.uimr.service;

import com.uimr.dto.request.ReportRequest;
import com.uimr.exception.ResourceNotFoundException;
import com.uimr.model.Incident;
import com.uimr.model.Ioc;
import com.uimr.model.Report;
import com.uimr.model.User;
import com.uimr.model.enums.ReportStatus;
import com.uimr.repository.IncidentRepository;
import com.uimr.repository.IocRepository;
import com.uimr.repository.ReportRepository;
import com.uimr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepo;
    private final UserRepository userRepo;
    private final IncidentRepository incidentRepo;
    private final IocRepository iocRepo;

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

        Long reportId = report.getId();
        CompletableFuture.runAsync(() -> generateRealReport(reportId));

        return report;
    }

    private void generateRealReport(Long reportId) {
        try {
            Thread.sleep(3000); // Simulate processing time
            Report report = reportRepo.findById(reportId).orElseThrow();

            String content;
            switch (report.getType()) {
                case "IOC_ANALYTICS":
                    content = generateIocReport(report);
                    break;
                case "SOC_PERFORMANCE":
                    content = generateSocPerformanceReport(report);
                    break;
                case "INCIDENT_SUMMARY":
                default:
                    content = generateIncidentSummaryReport(report);
                    break;
            }

            report.setStatus(ReportStatus.READY);
            report.setFileUrl("/api/reports/download/" + reportId);
            report.setReportContent(content);
            reportRepo.save(report);
            log.info("Report {} generated successfully ({} bytes)", reportId, content.length());
        } catch (Exception e) {
            log.error("Report generation failed: {}", e.getMessage());
            reportRepo.findById(reportId).ifPresent(r -> {
                r.setStatus(ReportStatus.FAILED);
                reportRepo.save(r);
            });
        }
    }

    private String generateIncidentSummaryReport(Report report) {
        List<Incident> incidents = incidentRepo.findAll();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        StringBuilder sb = new StringBuilder();
        sb.append("=".repeat(70)).append("\n");
        sb.append("  UIMR — INCIDENT SUMMARY REPORT\n");
        sb.append("  Report: ").append(report.getName()).append("\n");
        sb.append("  Generated: ").append(LocalDateTime.now().format(dtf)).append("\n");
        sb.append("  Classification: CONFIDENTIAL\n");
        sb.append("=".repeat(70)).append("\n\n");

        // Statistics
        long total = incidents.size();
        long open = incidents.stream().filter(i -> i.getStatus().name().equals("OPEN")).count();
        long inProgress = incidents.stream().filter(i -> i.getStatus().name().equals("IN_PROGRESS")).count();
        long closed = incidents.stream().filter(i -> i.getStatus().name().equals("CLOSED")).count();
        long critical = incidents.stream().filter(i -> i.getSeverity().name().equals("CRITICAL")).count();
        long high = incidents.stream().filter(i -> i.getSeverity().name().equals("HIGH")).count();

        sb.append("SUMMARY STATISTICS\n");
        sb.append("-".repeat(40)).append("\n");
        sb.append(String.format("  Total Incidents:    %d\n", total));
        sb.append(String.format("  Open:               %d\n", open));
        sb.append(String.format("  In Progress:        %d\n", inProgress));
        sb.append(String.format("  Closed/Resolved:    %d\n", closed));
        sb.append(String.format("  Critical Severity:  %d\n", critical));
        sb.append(String.format("  High Severity:      %d\n", high));
        sb.append("\n");

        // By source
        sb.append("INCIDENTS BY SOURCE\n");
        sb.append("-".repeat(40)).append("\n");
        incidents.stream()
                .collect(Collectors.groupingBy(i -> i.getSource().name(), Collectors.counting()))
                .forEach((source, count) -> sb.append(String.format("  %-20s %d\n", source, count)));
        sb.append("\n");

        // Incident list
        sb.append("INCIDENT DETAILS\n");
        sb.append("-".repeat(70)).append("\n");
        sb.append(String.format("%-5s %-30s %-10s %-12s %-12s\n", "ID", "TITLE", "SEVERITY", "STATUS", "SOURCE"));
        sb.append("-".repeat(70)).append("\n");
        for (Incident inc : incidents) {
            sb.append(String.format("%-5d %-30s %-10s %-12s %-12s\n",
                    inc.getId(),
                    inc.getTitle().length() > 28 ? inc.getTitle().substring(0, 28) + ".." : inc.getTitle(),
                    inc.getSeverity(),
                    inc.getStatus(),
                    inc.getSource()));
        }

        sb.append("\n").append("=".repeat(70)).append("\n");
        sb.append("  END OF REPORT\n");
        return sb.toString();
    }

    private String generateIocReport(Report report) {
        List<Ioc> iocs = iocRepo.findAll();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        StringBuilder sb = new StringBuilder();
        sb.append("=".repeat(70)).append("\n");
        sb.append("  UIMR — IOC ANALYTICS REPORT\n");
        sb.append("  Report: ").append(report.getName()).append("\n");
        sb.append("  Generated: ").append(LocalDateTime.now().format(dtf)).append("\n");
        sb.append("=".repeat(70)).append("\n\n");

        sb.append("IOC STATISTICS\n");
        sb.append("-".repeat(40)).append("\n");
        sb.append(String.format("  Total IOCs:  %d\n", iocs.size()));

        iocs.stream()
                .collect(Collectors.groupingBy(i -> i.getType().name(), Collectors.counting()))
                .forEach((type, count) -> sb.append(String.format("  %-20s %d\n", type, count)));
        sb.append("\n");

        sb.append("IOC DETAILS\n");
        sb.append("-".repeat(70)).append("\n");
        sb.append(String.format("%-8s %-40s %-12s %-10s\n", "TYPE", "VALUE", "TI STATUS", "INCIDENT"));
        sb.append("-".repeat(70)).append("\n");
        for (Ioc ioc : iocs) {
            sb.append(String.format("%-8s %-40s %-12s #%-9d\n",
                    ioc.getType(),
                    ioc.getValue().length() > 38 ? ioc.getValue().substring(0, 38) + ".." : ioc.getValue(),
                    ioc.getTiStatus() != null ? ioc.getTiStatus() : "UNCHECKED",
                    ioc.getIncident().getId()));
        }

        sb.append("\n").append("=".repeat(70)).append("\n");
        return sb.toString();
    }

    private String generateSocPerformanceReport(Report report) {
        List<Incident> incidents = incidentRepo.findAll();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        long closed = incidents.stream().filter(i -> i.getClosedAt() != null).count();
        double avgResolveMinutes = incidents.stream()
                .filter(i -> i.getClosedAt() != null)
                .mapToLong(i -> java.time.Duration.between(i.getCreatedAt(), i.getClosedAt()).toMinutes())
                .average().orElse(0);

        StringBuilder sb = new StringBuilder();
        sb.append("=".repeat(70)).append("\n");
        sb.append("  UIMR — SOC PERFORMANCE REPORT\n");
        sb.append("  Report: ").append(report.getName()).append("\n");
        sb.append("  Generated: ").append(LocalDateTime.now().format(dtf)).append("\n");
        sb.append("=".repeat(70)).append("\n\n");

        sb.append("PERFORMANCE METRICS\n");
        sb.append("-".repeat(40)).append("\n");
        sb.append(String.format("  Total Incidents:        %d\n", incidents.size()));
        sb.append(String.format("  Resolved Incidents:     %d\n", closed));
        sb.append(String.format("  Resolution Rate:        %.1f%%\n", incidents.size() > 0 ? (closed * 100.0 / incidents.size()) : 0));
        sb.append(String.format("  Mean Time to Resolve:   %.0f minutes\n", avgResolveMinutes));
        sb.append("\n");

        sb.append("ANALYST WORKLOAD\n");
        sb.append("-".repeat(40)).append("\n");
        incidents.stream()
                .filter(i -> i.getAssignee() != null)
                .collect(Collectors.groupingBy(i -> i.getAssignee().getFullName(), Collectors.counting()))
                .forEach((analyst, count) -> sb.append(String.format("  %-25s %d incidents\n", analyst, count)));

        sb.append("\n").append("=".repeat(70)).append("\n");
        return sb.toString();
    }

    public Report getReport(Long id) {
        return reportRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + id));
    }

    public void deleteReport(Long id) {
        reportRepo.deleteById(id);
    }
}
