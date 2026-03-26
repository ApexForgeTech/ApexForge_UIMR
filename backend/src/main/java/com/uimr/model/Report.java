package com.uimr.model;

import com.uimr.model.enums.ReportStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String type; // e.g., "INCIDENT_SUMMARY", "SLA_REPORT"
    private String format; // e.g., "PDF", "CSV", "JSON"

    @Enumerated(EnumType.STRING)
    private ReportStatus status;

    private String fileUrl; // URL or path to the generated file

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by_id")
    private User generatedBy;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
