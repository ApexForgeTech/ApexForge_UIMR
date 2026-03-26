package com.uimr.repository;

import com.uimr.model.Ioc;
import com.uimr.model.enums.TiStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IocRepository extends JpaRepository<Ioc, Long> {
    List<Ioc> findByIncidentId(Long incidentId);
    List<Ioc> findByTiStatus(TiStatus status);
    boolean existsByIncidentIdAndValue(Long incidentId, String value);
}
