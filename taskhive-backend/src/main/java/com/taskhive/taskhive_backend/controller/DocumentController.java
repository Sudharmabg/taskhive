package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.Document;
import com.taskhive.taskhive_backend.model.DocumentFile;
import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.repository.DocumentFileRepository;
import com.taskhive.taskhive_backend.repository.DocumentRepository;
import com.taskhive.taskhive_backend.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Company document library. Everyone in the company can upload, tag, browse and download
 * documents; the uploader or an admin can edit details or delete them.
 */
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    /** Keep in sync with spring.servlet.multipart.max-file-size. */
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final int MAX_TITLE = 150;
    private static final int MAX_DESCRIPTION = 1000;
    private static final int MAX_TAGS = 10;
    private static final int MAX_TAG_LENGTH = 30;
    private static final Pattern TAG_CHARS = Pattern.compile("[\\p{L}\\p{N} ._-]+");

    private final DocumentRepository documentRepository;
    private final DocumentFileRepository fileRepository;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<?> list() {
        User user = currentUserService.get().orElse(null);
        if (user == null) return error("You must be signed in");
        return ResponseEntity.ok(documentRepository.findByCompanyIdOrderByCreatedAtDesc(companyId(user))
            .stream().map(d -> view(d, user)).toList());
    }

    /** Tags in use across the company, with document counts. */
    @GetMapping("/tags")
    public ResponseEntity<?> tags() {
        User user = currentUserService.get().orElse(null);
        if (user == null) return error("You must be signed in");
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : documentRepository.countTags(companyId(user))) {
            result.add(Map.of("tag", row[0], "count", row[1]));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file,
                                    @RequestParam(value = "title", required = false) String title,
                                    @RequestParam(value = "description", required = false) String description,
                                    @RequestParam(value = "tags", required = false) List<String> tags) {
        User user = currentUserService.get().orElse(null);
        if (user == null) return error("You must be signed in to upload documents");
        if (file == null || file.isEmpty()) return error("Choose a file to upload");
        if (file.getSize() > MAX_FILE_SIZE) return error("File '" + file.getOriginalFilename() + "' exceeds the 10 MB limit");

        Document doc = new Document();
        String fileName = sanitizeFileName(file.getOriginalFilename());
        String problem = applyDetails(doc, title != null && !title.isBlank() ? title : stripExtension(fileName),
            description, tags != null ? tags : List.of());
        if (problem != null) return error(problem);

        // Read the bytes before saving anything so a read failure leaves no half-saved document
        byte[] data;
        try {
            data = file.getBytes();
        } catch (Exception e) {
            log.error("Document upload failed: {}", e.getMessage());
            return error("Could not read the uploaded file");
        }

        doc.setCompanyId(companyId(user));
        doc.setFileName(fileName);
        doc.setContentType(file.getContentType());
        doc.setFileSize((long) data.length);
        doc.setUploadedBy(user.getId());
        doc.setUploadedByName(user.getName());
        Document saved = documentRepository.save(doc);
        fileRepository.save(new DocumentFile(saved.getId(), data));
        log.info("Document {} uploaded by user {}", saved.getId(), user.getId());
        return ResponseEntity.ok(view(saved, user));
    }

    /** Edit title, description and tags. */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        User user = currentUserService.get().orElse(null);
        Document doc = find(id, user);
        if (doc == null) return error("Document not found");
        if (!canManage(doc, user)) return error("Only the uploader or an admin can edit this document");

        List<String> tags = new ArrayList<>();
        if (body.get("tags") instanceof Collection<?> raw) {
            raw.forEach(t -> tags.add(String.valueOf(t)));
        } else if (body.get("tags") != null) {
            tags.add(String.valueOf(body.get("tags")));
        }
        String problem = applyDetails(doc, str(body.get("title")), str(body.get("description")), tags);
        if (problem != null) return error(problem);
        doc.setUpdatedByName(user.getName());
        return ResponseEntity.ok(view(documentRepository.save(doc), user));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> download(@PathVariable Long id) {
        User user = currentUserService.get().orElse(null);
        Document doc = find(id, user);
        if (doc == null) return ResponseEntity.notFound().build();
        Optional<DocumentFile> file = fileRepository.findById(id);
        if (file.isEmpty()) return ResponseEntity.notFound().build();

        MediaType type;
        try {
            type = doc.getContentType() != null ? MediaType.parseMediaType(doc.getContentType()) : MediaType.APPLICATION_OCTET_STREAM;
        } catch (Exception e) {
            type = MediaType.APPLICATION_OCTET_STREAM;
        }
        byte[] data = file.get().getData();
        return ResponseEntity.ok()
            .contentType(type)
            .contentLength(data.length)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                .filename(doc.getFileName(), StandardCharsets.UTF_8).build().toString())
            .body(data);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id) {
        User user = currentUserService.get().orElse(null);
        Document doc = find(id, user);
        if (doc == null) return error("Document not found");
        if (!canManage(doc, user)) return error("Only the uploader or an admin can delete this document");
        fileRepository.deleteById(id);
        documentRepository.delete(doc);
        log.info("Document {} deleted by user {}", id, user.getId());
        return ResponseEntity.ok(Map.of("success", true));
    }

    /** Validates and copies title, description and tags; returns an error message or null. */
    private static String applyDetails(Document doc, String title, String description, List<String> rawTags) {
        title = title != null ? title.trim() : "";
        if (title.isEmpty()) return "Give the document a title";
        if (title.length() > MAX_TITLE) return "Title must be " + MAX_TITLE + " characters or fewer";
        description = description != null && !description.isBlank() ? description.trim() : null;
        if (description != null && description.length() > MAX_DESCRIPTION) {
            return "Description must be " + MAX_DESCRIPTION + " characters or fewer";
        }

        Set<String> tags = new LinkedHashSet<>();
        for (String raw : rawTags) {
            if (raw == null) continue;
            // Accept "a, b" as well as separate values
            for (String part : raw.split(",")) {
                String tag = part.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
                if (tag.startsWith("#")) tag = tag.substring(1).trim();
                if (tag.isEmpty()) continue;
                if (tag.length() > MAX_TAG_LENGTH) return "Tag \"" + tag + "\" is longer than " + MAX_TAG_LENGTH + " characters";
                if (!TAG_CHARS.matcher(tag).matches()) {
                    return "Tag \"" + tag + "\" can only use letters, numbers, spaces, dots, dashes and underscores";
                }
                tags.add(tag);
            }
        }
        if (tags.size() > MAX_TAGS) return "A document can have at most " + MAX_TAGS + " tags";

        doc.setTitle(title);
        doc.setDescription(description);
        doc.getTags().clear();
        doc.getTags().addAll(tags);
        return null;
    }

    private Document find(Long id, User user) {
        if (user == null) return null;
        return documentRepository.findById(id)
            .filter(d -> Objects.equals(d.getCompanyId(), companyId(user)))
            .orElse(null);
    }

    private static boolean canManage(Document doc, User user) {
        return CurrentUserService.isAdmin(user) || Objects.equals(doc.getUploadedBy(), user.getId());
    }

    private static Map<String, Object> view(Document d, User user) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("title", d.getTitle());
        m.put("description", d.getDescription());
        m.put("fileName", d.getFileName());
        m.put("contentType", d.getContentType());
        m.put("fileSize", d.getFileSize());
        m.put("tags", d.getTags().stream().sorted().toList());
        m.put("uploadedBy", d.getUploadedBy());
        m.put("uploadedByName", d.getUploadedByName());
        m.put("updatedByName", d.getUpdatedByName());
        m.put("mine", Objects.equals(d.getUploadedBy(), user.getId()));
        m.put("canManage", canManage(d, user));
        m.put("createdAt", d.getCreatedAt());
        m.put("updatedAt", d.getUpdatedAt());
        return m;
    }

    private static Long companyId(User user) {
        return user.getCompany() != null ? user.getCompany().getId() : null;
    }

    private static String str(Object value) {
        return value == null ? null : value.toString();
    }

    private static String sanitizeFileName(String name) {
        if (name == null || name.isBlank()) return "file";
        String base = name.replace('\\', '/');
        base = base.substring(base.lastIndexOf('/') + 1);
        return base.length() > 255 ? base.substring(base.length() - 255) : base;
    }

    private static String stripExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        String base = dot > 0 ? fileName.substring(0, dot) : fileName;
        return base.length() > MAX_TITLE ? base.substring(0, MAX_TITLE) : base;
    }

    private static ResponseEntity<?> error(String message) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", message));
    }
}
