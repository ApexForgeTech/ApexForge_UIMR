package com.uimr.controller;

import com.uimr.dto.request.NoteRequest;
import com.uimr.model.AnalystNote;
import com.uimr.service.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/incidents/{incidentId}/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getNotes(@PathVariable Long incidentId) {
        List<Map<String, Object>> notes = noteService.getNotes(incidentId).stream()
                .map(n -> Map.<String, Object>of(
                        "id", n.getId(),
                        "content", n.getContent(),
                        "authorName", n.getAuthor().getFullName(),
                        "authorId", n.getAuthor().getId(),
                        "createdAt", n.getCreatedAt().toString(),
                        "updatedAt", n.getUpdatedAt().toString()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(notes);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addNote(
            @PathVariable Long incidentId,
            @Valid @RequestBody NoteRequest request,
            Authentication auth) {
        AnalystNote note = noteService.addNote(incidentId, request, auth.getName());
        return ResponseEntity.ok(Map.of(
                "id", note.getId(),
                "content", note.getContent(),
                "authorName", note.getAuthor().getFullName(),
                "createdAt", note.getCreatedAt().toString()
        ));
    }

    @DeleteMapping("/{noteId}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long incidentId, @PathVariable Long noteId) {
        noteService.deleteNote(noteId);
        return ResponseEntity.noContent().build();
    }
}
