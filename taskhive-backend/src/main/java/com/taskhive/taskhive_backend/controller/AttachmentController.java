package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.Attachment;
import com.taskhive.taskhive_backend.repository.AttachmentRepository;
import com.taskhive.taskhive_backend.repository.StoryRepository;
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

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class AttachmentController {

    /** Per-file limit; keep in sync with spring.servlet.multipart.max-file-size. */
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;

    private final AttachmentRepository attachmentRepository;
    private final StoryRepository storyRepository;

    @GetMapping("/stories/{storyId}/attachments")
    public ResponseEntity<?> listAttachments(@PathVariable Long storyId) {
        return ResponseEntity.ok(attachmentRepository.findByStoryIdOrderByUploadedAtAsc(storyId));
    }

    @PostMapping(value = "/stories/{storyId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAttachments(@PathVariable Long storyId,
                                               @RequestParam("files") List<MultipartFile> files,
                                               @RequestParam(value = "uploadedBy", required = false) String uploadedBy) {
        log.info("[ENTRY] POST /api/stories/{}/attachments - {} file(s)", storyId, files.size());
        if (!storyRepository.existsById(storyId)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Story not found"));
        }
        try {
            List<Attachment> saved = new ArrayList<>();
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                if (file.getSize() > MAX_FILE_SIZE) {
                    return ResponseEntity.badRequest().body(Map.of("success", false,
                        "message", "File '" + file.getOriginalFilename() + "' exceeds the 10 MB limit"));
                }
                Attachment a = new Attachment();
                a.setStoryId(storyId);
                a.setFileName(sanitizeFileName(file.getOriginalFilename()));
                a.setContentType(file.getContentType());
                a.setFileSize(file.getSize());
                a.setData(file.getBytes());
                a.setUploadedBy(uploadedBy);
                saved.add(attachmentRepository.save(a));
            }
            log.info("[EXIT] POST /api/stories/{}/attachments - Saved {}", storyId, saved.size());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("[EXIT] POST /api/stories/{}/attachments - Error: {}", storyId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
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
        if (!attachmentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        attachmentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Attachment deleted"));
    }

    private static String sanitizeFileName(String name) {
        if (name == null || name.isBlank()) return "file";
        String base = name.replace('\\', '/');
        base = base.substring(base.lastIndexOf('/') + 1);
        return base.length() > 255 ? base.substring(base.length() - 255) : base;
    }
}
