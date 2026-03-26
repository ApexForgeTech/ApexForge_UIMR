package com.uimr.service;

import com.uimr.dto.request.KbArticleRequest;
import com.uimr.exception.ResourceNotFoundException;
import com.uimr.model.*;
import com.uimr.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KnowledgeBaseService {

    private final KbArticleRepository articleRepo;
    private final UserRepository userRepo;

    public KbArticle createArticle(KbArticleRequest request, String username) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        KbArticle article = KbArticle.builder()
                .title(request.getTitle())
                .contentMarkdown(request.getContentMarkdown())
                .category(request.getCategory())
                .tags(request.getTags())
                .author(user)
                .build();

        return articleRepo.save(article);
    }

    public KbArticle updateArticle(Long id, KbArticleRequest request) {
        KbArticle article = articleRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
        article.setTitle(request.getTitle());
        article.setContentMarkdown(request.getContentMarkdown());
        article.setCategory(request.getCategory());
        article.setTags(request.getTags());
        return articleRepo.save(article);
    }

    public KbArticle getArticle(Long id) {
        return articleRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
    }

    public Page<KbArticle> getArticles(String category, String search, Pageable pageable) {
        if (search != null && !search.isEmpty()) {
            return articleRepo.search(search, pageable);
        }
        if (category != null && !category.isEmpty()) {
            return articleRepo.findByCategory(category, pageable);
        }
        return articleRepo.findAll(pageable);
    }

    public List<String> getCategories() {
        return articleRepo.findAllCategories();
    }

    public void deleteArticle(Long id) {
        articleRepo.deleteById(id);
    }
}
