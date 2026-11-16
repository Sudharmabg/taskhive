package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.Attachment;
import com.taskhive.taskhive_backend.model.AuditLog;
import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.model.Subtask;
import com.taskhive.taskhive_backend.repository.AttachmentRepository;
import com.taskhive.taskhive_backend.repository.StoryRepository;
import com.taskhive.taskhive_backend.repository.SubtaskRepository;
import com.taskhive.taskhive_backend.service.AuditService;
import com.taskhive.taskhive_backend.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/** Files attached to Epics, Tasks, Bugs and their subtasks. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class AttachmentController {

    /** Per-file limit; keep in sync with spring.servlet.multipart.max-file-size. */
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;

    private final AttachmentRepository attachmentRepository;
    private final StoryRepository storyRepository;
    private final SubtaskRepository subtaskRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    @GetMapping("/stories/{storyId}/attachments")
    public ResponseEntity<?> listStoryAttachments(@PathVariable Long storyId) {
        return ResponseEntity.ok(attachmentRepository.findByStoryIdAndSubtaskIdIsNullOrderByUploadedAtAsc(storyId));
    }

    @PostMapping(value = "/stories/{storyId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadStoryAttachments(@PathVariable Long storyId,
                                                    @RequestParam("files") List<MultipartFile> files) {
        Optional<Story> story = storyRepository.findById(storyId);
        if (story.isEmpty()) {
            return error("Story not found");
        }
        return save(story.get(), null, files);
    }

    @GetMapping("/subtasks/{subtaskId}/attachments")
    public ResponseEntity<?> listSubtaskAttachments(@PathVariable Long subtaskId) {
        return ResponseEntity.ok(attachmentRepository.findBySubtaskIdOrderByUploadedAtAsc(subtaskId));
    }

    @PostMapping(value = "/subtasks/{subtaskId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadSubtaskAttachments(@PathVariable Long subtaskId,
                                                      @RequestParam("files") List<MultipartFile> files) {
        Optional<Subtask> subtask = subtaskRepository.findById(subtaskId);
        if (subtask.isEmpty()) {
            return error("Subtask not found");
        }
        Optional<Story> story = storyRepository.findById(subtask.get().getStoryId());
        if (story.isEmpty()) {
            return error("Story not found");
        }
        return save(story.get(), subtask.get(), files);
    }

    @GetMapping("/attachments/{id}/download")
    public ResponseEntity<?> download(@PathVariable Long id) {
        return attachmentRepository.findById(id)
            .<ResponseEntity<?>>map(a -> {
                MediaType type;
                try {
                    type = a.getContentType() != null ? MediaType.parseMediaType(a.getContentType()) : MediaType.APPLICATION_OCTET_STREAM;
                } catch (Exception e) {
                    type = MediaType.APPLICATION_OCTET_STREAM;
                }
                return ResponseEntity.ok()
                    .contentType(type)
                    .contentLength(a.getFileSize())
                    .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(a.getFileName(), StandardCharsets.UTF_8).build().toString())
                    .body(a.getData());
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/attachments/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Optional<Attachment> attachment = attachmentRepository.findById(id);
        if (attachment.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Attachment a = attachment.get();
        attachmentRepository.deleteById(id);
        storyRepository.findById(a.getStoryId()).ifPresent(story ->
            auditService.record(story, AuditLog.Action.UPDATED,
                "Removed attachment \"" + a.getFileName() + "\"" + subtaskSuffix(a.getSubtaskId())));
        return ResponseEntity.ok(Map.of("success", true, "message", "Attachment deleted"));
    }

    private ResponseEntity<?> save(Story story, Subtask subtask, List<MultipartFile> files) {
        // Validate everything first so a bad file doesn't leave a partial upload
        for (MultipartFile file : files) {
            if (file.getSize() > MAX_FILE_SIZE) {
                return error("File '" + file.getOriginalFilename() + "' exceeds the 10 MB limit");
            }
        }
        try {
            String uploadedBy = currentUserService.displayName();
            List<Attachment> saved = new ArrayList<>();
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                Attachment a = new Attachment();
                a.setStoryId(story.getId());
                a.setSubtaskId(subtask != null ? subtask.getId() : null);
                a.setFileName(sanitizeFileName(file.getOriginalFilename()));
                a.setContentType(file.getContentType());
                a.setFileSize(file.getSize());
                a.setData(file.getBytes());
                a.setUploadedBy(uploadedBy);
                saved.add(attachmentRepository.save(a));
            }
            if (!saved.isEmpty()) {
                String names = saved.stream().map(a -> "\"" + a.getFileName() + "\"").collect(Collectors.joining(", "));
                auditService.record(story, AuditLog.Action.UPDATED,
                    "Added attachment" + (saved.size() > 1 ? "s " : " ") + names
                        + (subtask != null ? " to subtask \"" + subtask.getTitle() + "\"" : ""));
            }
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Attachment upload failed for story {}: {}", story.getId(), e.getMessage());
            return error(e.getMessage());
        }
    }

    private String subtaskSuffix(Long subtaskId) {
        if (subtaskId == null) return "";
        return subtaskRepository.findById(subtaskId)
            .map(s -> " from subtask \"" + s.getTitle() + "\"")
            .orElse("");
    }

    private static String sanitizeFileName(String name) {
        if (name == null || name.isBlank()) return "file";
        String base = name.replace('\\', '/');
        base = base.substring(base.lastIndexOf('/') + 1);
        return base.length() > 255 ? base.substring(base.length() - 255) : base;
    }

    private static ResponseEntity<?> error(String message) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", message));
    }
}
