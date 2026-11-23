package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.Document;
import com.taskhive.taskhive_backend.model.DocumentComment;
import com.taskhive.taskhive_backend.model.DocumentFile;
import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.repository.DocumentCommentRepository;
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
 * Company document library. Everyone in the company can view, create, edit, and comment on
 * documents (Google Docs style); the uploader or an admin can manage or delete them.
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
    private final DocumentCommentRepository commentRepository;
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

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        User user = currentUserService.get().orElse(null);
        Document doc = find(id, user);
        if (doc == null) return error("Document not found");

        // If content is null, check if we can populate it from file data
        if (doc.getContent() == null) {
            fileRepository.findById(id).ifPresent(file -> {
                byte[] data = file.getData();
                if (data != null) {
                    String fn = doc.getFileName() != null ? doc.getFileName().toLowerCase() : "";
                    if (fn.endsWith(".docx")) {
                        String docxText = extractDocxText(data);
                        if (docxText != null && !docxText.isBlank()) {
                            doc.setContent(sanitizeContent(docxText));
                            documentRepository.save(doc);
                        }
                    } else if (data.length < 500_000 && isTextFile(doc.getFileName(), doc.getContentType())) {
                        try {
                            doc.setContent(sanitizeContent(new String(data, StandardCharsets.UTF_8)));
                            documentRepository.save(doc);
                        } catch (Exception ignored) {}
                    }
                }
            });
        }

        return ResponseEntity.ok(view(doc, user));
    }

    /** Create a new document directly (Google Docs style). */
    @PostMapping(path = "/create", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Transactional
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        User user = currentUserService.get().orElse(null);
        if (user == null) return error("You must be signed in to create documents");

        String title = str(body.get("title"));
        String description = str(body.get("description"));
        String content = str(body.get("content"));
        if (content == null) content = "";

        List<String> tags = new ArrayList<>();
        if (body.get("tags") instanceof Collection<?> raw) {
            raw.forEach(t -> tags.add(String.valueOf(t)));
        }

        Document doc = new Document();
        String problem = applyDetails(doc, title, description, tags);
        if (problem != null) return error(problem);

        String safeTitle = doc.getTitle().toLowerCase().replaceAll("[^a-z0-9_-]+", "-");
        if (safeTitle.isBlank()) safeTitle = "document";
        String fileName = safeTitle + ".docx";

        byte[] data;
        try {
            data = com.taskhive.taskhive_backend.util.DocxGenerator.generateDocx(doc.getTitle(), content);
        } catch (Exception e) {
            data = content.getBytes(StandardCharsets.UTF_8);
        }

        doc.setCompanyId(companyId(user));
        doc.setFileName(fileName);
        doc.setContentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        doc.setFileSize((long) data.length);
        doc.setContent(sanitizeContent(content));
        doc.setUploadedBy(user.getId());
        doc.setUploadedByName(user.getName());
        Document saved = documentRepository.save(doc);
        fileRepository.save(new DocumentFile(saved.getId(), data));
        log.info("Document {} created by user {}", saved.getId(), user.getId());
        return ResponseEntity.ok(view(saved, user));
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

        // Extract text content if it is a Word .docx or text-based file
        if (fileName != null && fileName.toLowerCase().endsWith(".docx")) {
            String extracted = extractDocxText(data);
            if (extracted != null && !extracted.isBlank()) {
                doc.setContent(sanitizeContent(extracted));
            }
        } else if (isTextFile(fileName, file.getContentType()) && data.length < 500_000) {
            try {
                String text = new String(data, StandardCharsets.UTF_8);
                doc.setContent(sanitizeContent(text));
            } catch (Exception ignored) {}
        }

        Document saved = documentRepository.save(doc);
        fileRepository.save(new DocumentFile(saved.getId(), data));
        log.info("Document {} uploaded by user {}", saved.getId(), user.getId());
        return ResponseEntity.ok(view(saved, user));
    }

    /** Edit title, description, tags, and content. */
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        User user = currentUserService.get().orElse(null);
        Document doc = find(id, user);
        if (doc == null) return error("Document not found");
        if (!canEdit(doc, user)) return error("You do not have permission to edit this document");

        List<String> tags = new ArrayList<>();
        if (body.get("tags") instanceof Collection<?> raw) {
            raw.forEach(t -> tags.add(String.valueOf(t)));
        } else if (body.get("tags") != null) {
            tags.add(String.valueOf(body.get("tags")));
        }
        String problem = applyDetails(doc, str(body.get("title")), str(body.get("description")), tags);
        if (problem != null) return error(problem);

        if (body.containsKey("content")) {
            String content = str(body.get("content"));
            if (content == null) content = "";
            content = sanitizeContent(content);
            doc.setContent(content);

            // Keep docx binary up-to-date with user edits
            try {
                byte[] docxData = com.taskhive.taskhive_backend.util.DocxGenerator.generateDocx(doc.getTitle(), content);
                doc.setFileSize((long) docxData.length);
                doc.setContentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
                if (doc.getFileName() != null && !doc.getFileName().toLowerCase().endsWith(".docx")) {
                    doc.setFileName(doc.getFileName().replaceFirst("\\.[^.]+$", "") + ".docx");
                }
                fileRepository.save(new DocumentFile(doc.getId(), docxData));
            } catch (Exception e) {
                byte[] data = content.getBytes(StandardCharsets.UTF_8);
                doc.setFileSize((long) data.length);
                fileRepository.save(new DocumentFile(doc.getId(), data));
            }
        }

        doc.setUpdatedByName(user.getName());
        return ResponseEntity.ok(view(documentRepository.save(doc), user));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> download(@PathVariable Long id) {
        User user = currentUserService.get().orElse(null);
        Document doc = find(id, user);
        if (doc == null) return ResponseEntity.notFound().build();

        // If doc was originally uploaded as a .docx, serve the original binary
        boolean isOriginalDocx = doc.getFileName() != null && doc.getFileName().toLowerCase().endsWith(".docx");
        Optional<DocumentFile> file = fileRepository.findById(id);

        if (isOriginalDocx && file.isPresent()) {
            byte[] data = file.get().getData();
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .contentLength(data.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                    .filename(doc.getFileName(), StandardCharsets.UTF_8).build().toString())
                .body(data);
        }

        // For in-app created documents or edited documents, generate a clean .docx file
        try {
            String downloadTitle = (doc.getTitle() != null && !doc.getTitle().isBlank()) ? doc.getTitle() : "Document";
            String downloadFileName = downloadTitle.replaceAll("[^a-zA-Z0-9 ._-]+", "_") + ".docx";
            String contentText = doc.getContent() != null ? doc.getContent() : "";

            byte[] docxData = com.taskhive.taskhive_backend.util.DocxGenerator.generateDocx(downloadTitle, contentText);
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .contentLength(docxData.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                    .filename(downloadFileName, StandardCharsets.UTF_8).build().toString())
                .body(docxData);
        } catch (Exception e) {
            log.error("Failed to generate docx for document {}: {}", id, e.getMessage());
            // Fallback to raw file if generation fails
            if (file.isPresent()) {
                byte[] data = file.get().getData();
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(data.length)
                    .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(doc.getFileName() != null ? doc.getFileName() : "document.txt", StandardCharsets.UTF_8).build().toString())
                    .body(data);
            }
            return ResponseEntity.internalServerError().build();
        }
    }

    /** Direct view/open original file endpoint (opens inline in browser/viewer). */
    @GetMapping("/{id}/view")
    public ResponseEntity<?> viewOriginalFile(@PathVariable Long id) {
        User user = currentUserService.get().orElse(null);
        Document doc = find(id, user);
        if (doc == null) return ResponseEntity.notFound().build();
        Optional<DocumentFile> file = fileRepository.findById(id);
        if (file.isEmpty()) return ResponseEntity.notFound().build();

        MediaType type;
        try {
            if (doc.getContentType() != null && !doc.getContentType().isBlank()) {
                type = MediaType.parseMediaType(doc.getContentType());
            } else if (doc.getFileName() != null && doc.getFileName().toLowerCase().endsWith(".docx")) {
                type = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            } else {
                type = MediaType.APPLICATION_OCTET_STREAM;
            }
        } catch (Exception e) {
            type = MediaType.APPLICATION_OCTET_STREAM;
        }
        byte[] data = file.get().getData();
        return ResponseEntity.ok()
            .contentType(type)
            .contentLength(data.length)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
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
        commentRepository.deleteByDocumentId(id);
        fileRepository.deleteById(id);
        documentRepository.delete(doc);
        log.info("Document {} deleted by user {}", id, user.getId());
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ==========================================
    // Google Doc-Style Comments Endpoints
    // ==========================================

    /** Get all comments for a document, structured with threaded replies. */
    @GetMapping("/{id}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long id) {
        User user = currentUserService.get().orElse(null);
        Document doc = find(id, user);
        if (doc == null) return error("Document not found");

        List<DocumentComment> allComments = commentRepository.findByDocumentIdOrderByCreatedAtAsc(id);
        Map<Long, Map<String, Object>> commentMap = new LinkedHashMap<>();
        List<Map<String, Object>> topLevel = new ArrayList<>();

        for (DocumentComment c : allComments) {
            Map<String, Object> view = commentView(c, user);
            view.put("replies", new ArrayList<Map<String, Object>>());
            commentMap.put(c.getId(), view);
        }

        for (DocumentComment c : allComments) {
            Map<String, Object> current = commentMap.get(c.getId());
            if (c.getParentId() != null && commentMap.containsKey(c.getParentId())) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> replies = (List<Map<String, Object>>) commentMap.get(c.getParentId()).get("replies");
                replies.add(current);
            } else {
                topLevel.add(current);
            }
        }

        return ResponseEntity.ok(topLevel);
    }

    /** Add a new comment or reply to an existing comment. */
    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        User user = currentUserService.get().orElse(null);
        Document doc = find(id, user);
        if (doc == null) return error("Document not found");

        String content = str(body.get("content"));
        if (content == null || content.trim().isEmpty()) {
            return error("Comment cannot be empty");
        }

        DocumentComment comment = new DocumentComment();
        comment.setDocumentId(id);
        comment.setCompanyId(doc.getCompanyId());
        comment.setUserId(user.getId());
        comment.setUserName(user.getName());
        comment.setContent(content.trim());
        comment.setSelectedText(str(body.get("selectedText")));
        comment.setResolved(false);

        if (body.get("parentId") != null) {
            try {
                comment.setParentId(Long.parseLong(body.get("parentId").toString()));
            } catch (NumberFormatException ignored) {}
        }

        DocumentComment saved = commentRepository.save(comment);
        Map<String, Object> view = commentView(saved, user);
        view.put("replies", new ArrayList<>());
        return ResponseEntity.ok(view);
    }

    /** Resolve or unresolve a comment thread (Google Docs style). */
    @PutMapping("/{id}/comments/{commentId}/resolve")
    public ResponseEntity<?> resolveComment(@PathVariable Long id, @PathVariable Long commentId, @RequestBody(required = false) Map<String, Object> body) {
        User user = currentUserService.get().orElse(null);
        Document doc = find(id, user);
        if (doc == null) return error("Document not found");

        DocumentComment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null || !Objects.equals(comment.getDocumentId(), id)) {
            return error("Comment not found");
        }

        boolean resolved = body != null && body.containsKey("resolved")
            ? Boolean.parseBoolean(body.get("resolved").toString())
            : !Boolean.TRUE.equals(comment.getResolved());

        comment.setResolved(resolved);
        DocumentComment saved = commentRepository.save(comment);
        return ResponseEntity.ok(commentView(saved, user));
    }

    /** Delete a comment. */
    @DeleteMapping("/{id}/comments/{commentId}")
    @Transactional
    public ResponseEntity<?> deleteComment(@PathVariable Long id, @PathVariable Long commentId) {
        User user = currentUserService.get().orElse(null);
        Document doc = find(id, user);
        if (doc == null) return error("Document not found");

        DocumentComment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null || !Objects.equals(comment.getDocumentId(), id)) {
            return error("Comment not found");
        }

        if (!Objects.equals(comment.getUserId(), user.getId()) && !CurrentUserService.isAdmin(user) && !canManage(doc, user)) {
            return error("You can only delete your own comments");
        }

        commentRepository.deleteByParentId(commentId);
        commentRepository.delete(comment);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ==========================================
    // Helper Methods
    // ==========================================

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

    private static boolean canEdit(Document doc, User user) {
        if (user == null || doc == null) return false;
        return Objects.equals(doc.getCompanyId(), companyId(user));
    }

    private static boolean canManage(Document doc, User user) {
        return CurrentUserService.isAdmin(user) || Objects.equals(doc.getUploadedBy(), user.getId());
    }

    private static Map<String, Object> view(Document d, User user) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("title", d.getTitle());
        m.put("description", d.getDescription());
        m.put("content", d.getContent());
        m.put("fileName", d.getFileName());
        m.put("contentType", d.getContentType());
        m.put("fileSize", d.getFileSize());
        m.put("tags", d.getTags().stream().sorted().toList());
        m.put("fileUrl", "/api/documents/" + d.getId() + "/view");
        m.put("downloadUrl", "/api/documents/" + d.getId() + "/download");
        m.put("uploadedBy", d.getUploadedBy());
        m.put("uploadedByName", d.getUploadedByName());
        m.put("updatedByName", d.getUpdatedByName());
        m.put("mine", Objects.equals(d.getUploadedBy(), user.getId()));
        m.put("canManage", canManage(d, user));
        m.put("canEdit", canEdit(d, user));
        m.put("createdAt", d.getCreatedAt());
        m.put("updatedAt", d.getUpdatedAt());
        return m;
    }

    private static Map<String, Object> commentView(DocumentComment c, User user) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("documentId", c.getDocumentId());
        m.put("userId", c.getUserId());
        m.put("userName", c.getUserName() != null ? c.getUserName() : "User");
        m.put("selectedText", c.getSelectedText());
        m.put("content", c.getContent());
        m.put("resolved", Boolean.TRUE.equals(c.getResolved()));
        m.put("parentId", c.getParentId());
        m.put("createdAt", c.getCreatedAt());
        m.put("updatedAt", c.getUpdatedAt());
        m.put("isMine", user != null && Objects.equals(c.getUserId(), user.getId()));
        m.put("canDelete", user != null && (Objects.equals(c.getUserId(), user.getId()) || CurrentUserService.isAdmin(user)));
        return m;
    }

    private static boolean isTextFile(String fileName, String contentType) {
        if (fileName != null) {
            String fn = fileName.toLowerCase();
            // Binary formats should never be read as plain text
            if (fn.endsWith(".docx") || fn.endsWith(".doc") || fn.endsWith(".xlsx") || fn.endsWith(".xls")
                || fn.endsWith(".pptx") || fn.endsWith(".ppt") || fn.endsWith(".pdf") || fn.endsWith(".zip")
                || fn.endsWith(".rar") || fn.endsWith(".7z") || fn.endsWith(".tar") || fn.endsWith(".gz")
                || fn.endsWith(".png") || fn.endsWith(".jpg") || fn.endsWith(".jpeg") || fn.endsWith(".gif")
                || fn.endsWith(".webp") || fn.endsWith(".mp4") || fn.endsWith(".mp3") || fn.endsWith(".ico")
                || fn.endsWith(".exe") || fn.endsWith(".jar")) {
                return false;
            }
            if (fn.endsWith(".txt") || fn.endsWith(".md") || fn.endsWith(".html") || fn.endsWith(".htm")
                || fn.endsWith(".json") || fn.endsWith(".js") || fn.endsWith(".jsx") || fn.endsWith(".ts")
                || fn.endsWith(".tsx") || fn.endsWith(".css") || fn.endsWith(".csv") || fn.endsWith(".xml")
                || fn.endsWith(".yaml") || fn.endsWith(".yml") || fn.endsWith(".sql") || fn.endsWith(".log")
                || fn.endsWith(".env") || fn.endsWith(".properties")) {
                return true;
            }
        }
        if (contentType != null) {
            String ct = contentType.toLowerCase();
            if (ct.contains("openxmlformats") || ct.contains("officedocument") || ct.contains("word")
                || ct.contains("pdf") || ct.contains("octet-stream") || ct.contains("zip") || ct.startsWith("image/")
                || ct.startsWith("video/") || ct.startsWith("audio/")) {
                return false;
            }
            return ct.startsWith("text/") || ct.equals("application/json") || ct.equals("application/javascript") || ct.equals("application/xml");
        }
        return false;
    }

    private static String sanitizeContent(String text) {
        if (text == null) return null;
        // PostgreSQL cannot store NUL (0x00) characters in text/varchar columns
        if (text.contains("\u0000")) {
            text = text.replace("\u0000", "");
        }
        return text;
    }

    private static String extractDocxText(byte[] data) {
        try (java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(data))) {
            java.util.zip.ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if ("word/document.xml".equals(entry.getName())) {
                    String xml = new String(zis.readAllBytes(), StandardCharsets.UTF_8);
                    return convertDocxXmlToHtml(xml);
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private static String convertDocxXmlToHtml(String xml) {
        if (xml == null || xml.isBlank()) return null;
        try {
            StringBuilder html = new StringBuilder();
            java.util.regex.Pattern blockPattern = java.util.regex.Pattern.compile("(<w:tbl[ >].*?</w:tbl>|<w:p[ >].*?</w:p>)", java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher m = blockPattern.matcher(xml);

            while (m.find()) {
                String block = m.group(1);
                if (block.startsWith("<w:tbl")) {
                    html.append(parseDocxTable(block));
                } else if (block.startsWith("<w:p")) {
                    String p = parseDocxParagraph(block);
                    if (p != null && !p.isBlank()) {
                        html.append(p);
                    }
                }
            }
            return html.toString();
        } catch (Exception e) {
            log.error("Failed to convert docx xml to styled html: {}", e.getMessage());
            return xml.replaceAll("<[^>]+>", " ").replace("\u0000", "").trim();
        }
    }

    private static String parseDocxTable(String tblXml) {
        StringBuilder tbl = new StringBuilder("<div class=\"doc-table-wrapper\" style=\"overflow-x: auto; margin: 18px 0;\">");
        tbl.append("<table style=\"width: 100%; border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 13px; line-height: 1.4;\">");

        java.util.regex.Pattern rowPattern = java.util.regex.Pattern.compile("<w:tr[ >].*?</w:tr>", java.util.regex.Pattern.DOTALL);
        java.util.regex.Matcher rowMatcher = rowPattern.matcher(tblXml);
        boolean isFirstRow = true;

        while (rowMatcher.find()) {
            String rowXml = rowMatcher.group();
            boolean isHeader = isFirstRow || rowXml.contains("<w:tblHeader");
            String tag = isHeader ? "th" : "td";

            tbl.append("<tr>");

            java.util.regex.Pattern cellPattern = java.util.regex.Pattern.compile("<w:tc[ >].*?</w:tc>", java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher cellMatcher = cellPattern.matcher(rowXml);

            while (cellMatcher.find()) {
                String cellXml = cellMatcher.group();
                List<String> tcStyles = new ArrayList<>();
                tcStyles.add("border: 1px solid #D1D5DB");
                tcStyles.add("padding: 8px 10px");
                tcStyles.add("vertical-align: top");

                // Check cell background shading
                java.util.regex.Matcher shdM = java.util.regex.Pattern.compile("<w:shd[^>]*w:fill=\"([^\"]+)\"").matcher(cellXml);
                if (shdM.find()) {
                    String fill = shdM.group(1);
                    if (!"auto".equalsIgnoreCase(fill) && !fill.isBlank()) {
                        tcStyles.add("background-color: #" + fill);
                        if ("6B54A6".equalsIgnoreCase(fill)) {
                            tcStyles.add("color: #FFFFFF");
                            tcStyles.add("font-weight: bold");
                        }
                    }
                }

                // Cell paragraphs
                StringBuilder cellContent = new StringBuilder();
                java.util.regex.Pattern pPat = java.util.regex.Pattern.compile("<w:p[ >].*?</w:p>", java.util.regex.Pattern.DOTALL);
                java.util.regex.Matcher pMat = pPat.matcher(cellXml);
                boolean hasP = false;
                while (pMat.find()) {
                    hasP = true;
                    String parsedP = parseDocxParagraph(pMat.group());
                    if (parsedP != null && !parsedP.isBlank()) {
                        String trimmed = parsedP.trim();
                        // Simplify single paragraph inside table cell
                        if (trimmed.startsWith("<p") && trimmed.endsWith("</p>")) {
                            int closeTag = trimmed.indexOf('>');
                            trimmed = trimmed.substring(closeTag + 1, trimmed.length() - 4);
                        }
                        cellContent.append(trimmed);
                    }
                }
                if (!hasP) {
                    cellContent.append(cleanXmlText(cellXml));
                }

                tbl.append("<").append(tag).append(" style=\"").append(String.join("; ", tcStyles)).append("\">");
                tbl.append(cellContent.toString());
                tbl.append("</").append(tag).append(">");
            }

            tbl.append("</tr>");
            isFirstRow = false;
        }

        tbl.append("</table></div>\n");
        return tbl.toString();
    }

    private static String parseDocxParagraph(String pXml) {
        List<String> pStyles = new ArrayList<>();

        // Paragraph properties (w:pPr)
        int pPrStart = pXml.indexOf("<w:pPr");
        if (pPrStart != -1) {
            int pPrEnd = pXml.indexOf("</w:pPr>", pPrStart);
            String pPrXml = pPrEnd != -1 ? pXml.substring(pPrStart, pPrEnd + 8) : pXml.substring(pPrStart);

            // Alignment (w:jc)
            java.util.regex.Matcher jcM = java.util.regex.Pattern.compile("<w:jc[^>]*w:val=\"([^\"]+)\"").matcher(pPrXml);
            if (jcM.find()) {
                pStyles.add("text-align: " + jcM.group(1));
            }

            // Background shading (w:shd)
            java.util.regex.Matcher shdM = java.util.regex.Pattern.compile("<w:shd[^>]*w:fill=\"([^\"]+)\"").matcher(pPrXml);
            if (shdM.find()) {
                String fill = shdM.group(1);
                if (!"auto".equalsIgnoreCase(fill) && !fill.isBlank()) {
                    pStyles.add("background-color: #" + fill);
                    pStyles.add("padding: 10px 14px");
                    pStyles.add("border-radius: 4px");
                }
            }

            // Paragraph borders (w:pBdr)
            java.util.regex.Matcher leftBdr = java.util.regex.Pattern.compile("<w:left[^>]*w:color=\"([^\"]+)\"").matcher(pPrXml);
            if (leftBdr.find()) {
                pStyles.add("border-left: 4px solid #" + leftBdr.group(1));
            } else if (pPrXml.contains("<w:left")) {
                pStyles.add("border-left: 4px solid #6B54A6");
            }

            java.util.regex.Matcher bottomBdr = java.util.regex.Pattern.compile("<w:bottom[^>]*w:color=\"([^\"]+)\"").matcher(pPrXml);
            if (bottomBdr.find()) {
                pStyles.add("border-bottom: 1px solid #" + bottomBdr.group(1));
                pStyles.add("padding-bottom: 8px");
            } else if (pPrXml.contains("<w:bottom")) {
                pStyles.add("border-bottom: 1px solid #D1D5DB");
                pStyles.add("padding-bottom: 8px");
            }

            // Spacing before/after
            java.util.regex.Matcher beforeM = java.util.regex.Pattern.compile("w:before=\"(\\d+)\"").matcher(pPrXml);
            if (beforeM.find()) {
                int px = (int) Math.round(Integer.parseInt(beforeM.group(1)) / 20.0);
                if (px > 0) pStyles.add("margin-top: " + px + "px");
            }
            java.util.regex.Matcher afterM = java.util.regex.Pattern.compile("w:after=\"(\\d+)\"").matcher(pPrXml);
            if (afterM.find()) {
                int px = (int) Math.round(Integer.parseInt(afterM.group(1)) / 20.0);
                if (px > 0) pStyles.add("margin-bottom: " + px + "px");
            }
        }

        // Parse runs (w:r)
        StringBuilder runsHtml = new StringBuilder();
        java.util.regex.Pattern runPattern = java.util.regex.Pattern.compile("<w:r[ >].*?</w:r>", java.util.regex.Pattern.DOTALL);
        java.util.regex.Matcher runMatcher = runPattern.matcher(pXml);
        boolean hasRuns = false;

        while (runMatcher.find()) {
            hasRuns = true;
            String runXml = runMatcher.group();
            String runParsed = parseDocxRun(runXml);
            if (runParsed != null && !runParsed.isEmpty()) {
                runsHtml.append(runParsed);
            }
        }

        if (!hasRuns) {
            runsHtml.append(cleanXmlText(pXml));
        }

        String content = runsHtml.toString().trim();
        if (content.isEmpty()) return "";

        String styleAttr = pStyles.isEmpty() ? "" : " style=\"" + String.join("; ", pStyles) + "\"";
        return "<p" + styleAttr + ">" + content + "</p>\n";
    }

    private static String parseDocxRun(String runXml) {
        if (runXml.contains("<w:br/>") || runXml.contains("<w:br ")) {
            return "<br/>";
        }

        List<String> styles = new ArrayList<>();

        // Bold & Italic
        if (runXml.contains("<w:b/>") || runXml.contains("<w:b ") || runXml.contains("<w:bCs/>") || runXml.contains("<w:bCs ")) {
            styles.add("font-weight: bold");
        }
        if (runXml.contains("<w:i/>") || runXml.contains("<w:i ") || runXml.contains("<w:iCs/>") || runXml.contains("<w:iCs ")) {
            styles.add("font-style: italic");
        }

        // Font size (w:sz in half-pts)
        java.util.regex.Matcher szM = java.util.regex.Pattern.compile("<w:sz[^>]*w:val=\"(\\d+)\"").matcher(runXml);
        if (szM.find()) {
            int val = Integer.parseInt(szM.group(1));
            int px = Math.max(11, (int) Math.round(val * 0.65));
            styles.add("font-size: " + px + "px");
        }

        // Color (w:color)
        java.util.regex.Matcher colorM = java.util.regex.Pattern.compile("<w:color[^>]*w:val=\"([^\"]+)\"").matcher(runXml);
        if (colorM.find()) {
            String colorVal = colorM.group(1);
            if (!"auto".equalsIgnoreCase(colorVal) && !colorVal.isBlank()) {
                styles.add("color: #" + colorVal);
            }
        }

        // Font family (w:rFonts)
        java.util.regex.Matcher fontM = java.util.regex.Pattern.compile("<w:rFonts[^>]*w:ascii=\"([^\"]+)\"").matcher(runXml);
        if (fontM.find()) {
            styles.add("font-family: " + fontM.group(1) + ", Calibri, sans-serif");
        }

        // Text content
        StringBuilder textBuf = new StringBuilder();
        java.util.regex.Pattern tPattern = java.util.regex.Pattern.compile("<w:t[^>]*>(.*?)</w:t>", java.util.regex.Pattern.DOTALL);
        java.util.regex.Matcher tMatcher = tPattern.matcher(runXml);
        while (tMatcher.find()) {
            textBuf.append(tMatcher.group(1));
        }

        String rawText = textBuf.toString();
        if (rawText.isEmpty()) {
            return "";
        }

        // Escape HTML
        String escaped = rawText.replace("&", "&amp;")
                                .replace("<", "&lt;")
                                .replace(">", "&gt;")
                                .replace("\"", "&quot;")
                                .replace("\u0000", "");

        if (!styles.isEmpty()) {
            return "<span style=\"" + String.join("; ", styles) + "\">" + escaped + "</span>";
        }
        return escaped;
    }

    private static String cleanXmlText(String xmlFragment) {
        return xmlFragment.replaceAll("<[^>]+>", "")
                          .replaceAll("&lt;", "<")
                          .replaceAll("&gt;", ">")
                          .replaceAll("&amp;", "&")
                          .replaceAll("&quot;", "\"")
                          .replaceAll("&apos;", "'")
                          .replace("\u0000", "")
                          .trim();
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
