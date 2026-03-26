package com.uimr.dto.request;

import lombok.Data;

@Data
public class ReportRequest {
    private String name;
    private String type; // e.g., "INCIDENT_SUMMARY"
    private String format; // e.g., "PDF", "CSV"
}
