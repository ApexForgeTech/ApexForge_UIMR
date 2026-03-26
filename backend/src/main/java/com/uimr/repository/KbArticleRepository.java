package com.uimr.repository;

import com.uimr.model.KbArticle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface KbArticleRepository extends JpaRepository<KbArticle, Long> {
    Page<KbArticle> findByCategory(String category, Pageable pageable);

    @Query("SELECT DISTINCT k.category FROM KbArticle k WHERE k.category IS NOT NULL")
    List<String> findAllCategories();

    @Query("SELECT k FROM KbArticle k WHERE " +
           "LOWER(k.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(k.tags) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<KbArticle> search(@Param("q") String query, Pageable pageable);
}
