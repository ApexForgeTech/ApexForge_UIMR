package com.uimr.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class KbArticleRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String contentMarkdown;

    private String category;
    private String tags;
}
