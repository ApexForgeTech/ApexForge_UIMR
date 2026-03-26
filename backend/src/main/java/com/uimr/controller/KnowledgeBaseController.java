package com.uimr.controller;

import com.uimr.dto.request.KbArticleRequest;
import com.uimr.model.KbArticle;
import com.uimr.service.KnowledgeBaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kb/articles")
@RequiredArgsConstructor
public class KnowledgeBaseController {

    private final KnowledgeBaseService kbService;

    @GetMapping
    public ResponseEntity<Page<KbArticle>> getArticles(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(kbService.getArticles(category, search, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<KbArticle> getArticle(@PathVariable("id") Long id) {
        return ResponseEntity.ok(kbService.getArticle(id));
    }

    @PostMapping
    public ResponseEntity<KbArticle> createArticle(
            @Valid @RequestBody KbArticleRequest request,
            Authentication auth) {
        return ResponseEntity.ok(kbService.createArticle(request, auth.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<KbArticle> updateArticle(
            @PathVariable("id") Long id,
            @Valid @RequestBody KbArticleRequest request) {
        return ResponseEntity.ok(kbService.updateArticle(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable("id") Long id) {
        kbService.deleteArticle(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(kbService.getCategories());
    }
}
