package com.uimr.controller;

import com.uimr.dto.request.ReportRequest;
import com.uimr.model.Report;
import com.uimr.model.enums.ReportStatus;
import com.uimr.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getReports(Authentication auth) {
        return ResponseEntity.ok(reportService.getUserReports(auth.getName()).stream()
                .map(r -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", r.getId());
                    map.put("name", r.getName());
                    map.put("type", r.getType());
                    map.put("format", r.getFormat());
                    map.put("status", r.getStatus().name());
                    map.put("createdAt", r.getCreatedAt().toString());
                    map.put("fileUrl", r.getFileUrl() != null ? r.getFileUrl() : "");
                    return map;
                })
                .collect(Collectors.toList()));
    }

    @PostMapping("/generate")
    public ResponseEntity<Report> generateReport(@RequestBody ReportRequest request, Authentication auth) {
        return ResponseEntity.ok(reportService.createReport(request, auth.getName()));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadReport(@PathVariable("id") Long id) {
        Report report = reportService.getReport(id);
        if (report.getStatus() != ReportStatus.READY) {
            return ResponseEntity.badRequest().build();
        }

        String content = report.getReportContent();
        if (content == null || content.isEmpty()) {
            content = "Report data unavailable. Please regenerate.";
        }

        String filename;
        MediaType mediaType;
        String format = report.getFormat() != null ? report.getFormat().toUpperCase() : "TXT";

        switch (format) {
            case "CSV":
                filename = "report_" + id + ".csv";
                mediaType = MediaType.parseMediaType("text/csv");
                break;
            case "JSON":
                filename = "report_" + id + ".json";
                mediaType = MediaType.APPLICATION_JSON;
                break;
            default:
                filename = "report_" + id + ".txt";
                mediaType = MediaType.TEXT_PLAIN;
                break;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(content.getBytes());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable("id") Long id, Authentication auth) {
        reportService.deleteReport(id);
        return ResponseEntity.ok().build();
    }
}
