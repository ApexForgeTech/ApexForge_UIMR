package com.uimr.service;

import com.uimr.dto.request.NoteRequest;
import com.uimr.exception.ResourceNotFoundException;
import com.uimr.model.*;
import com.uimr.model.enums.TimelineEventType;
import com.uimr.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final AnalystNoteRepository noteRepo;
    private final IncidentRepository incidentRepo;
    private final UserRepository userRepo;
    private final TimelineService timelineService;

    @Transactional
    public AnalystNote addNote(Long incidentId, NoteRequest request, String username) {
        Incident incident = incidentRepo.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        AnalystNote note = AnalystNote.builder()
                .incident(incident)
                .content(request.getContent())
                .author(user)
                .build();

        note = noteRepo.save(note);

        timelineService.recordEvent(incident, TimelineEventType.NOTE_ADDED,
                "Note added by " + user.getFullName(), user);

        return note;
    }

    public List<AnalystNote> getNotes(Long incidentId) {
        return noteRepo.findByIncidentIdOrderByCreatedAtDesc(incidentId);
    }

    @Transactional
    public AnalystNote updateNote(Long noteId, NoteRequest request) {
        AnalystNote note = noteRepo.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
        note.setContent(request.getContent());
        return noteRepo.save(note);
    }

    public void deleteNote(Long noteId) {
        noteRepo.deleteById(noteId);
    }
}
