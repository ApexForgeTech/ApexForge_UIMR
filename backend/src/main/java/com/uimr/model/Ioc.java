package com.uimr.model;

import com.uimr.model.enums.IocType;
import com.uimr.model.enums.TiStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "iocs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ioc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IocType type;

    @Column(name = "ioc_value", nullable = false, length = 500)
    private String value;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TiStatus tiStatus = TiStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String tiResultJson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by")
    private User addedBy;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
