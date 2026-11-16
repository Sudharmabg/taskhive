package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.AuditLog;
import com.taskhive.taskhive_backend.repository.AuditLogRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    /** History of a single Epic/Task/Bug, newest first. */
    @GetMapping("/stories/{storyId}/history")
    public ResponseEntity<?> storyHistory(@PathVariable Long storyId) {
        return ResponseEntity.ok(auditLogRepository.findByStoryIdOrderByCreatedAtDescIdDesc(storyId));
    }

    /** Audit trail across all Epics, Tasks and Bugs, with optional filters. */
    @GetMapping("/audit")
    public ResponseEntity<?> search(@RequestParam(required = false) Long companyId,
                                    @RequestParam(required = false) String type,
                                    @RequestParam(required = false) String action,
                                    @RequestParam(required = false) String user,
                                    @RequestParam(required = false) String search,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "25") int size) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (companyId != null) {
                p.add(cb.or(cb.equal(root.get("companyId"), companyId), cb.isNull(root.get("companyId"))));
            }
            if (type != null && !type.isBlank()) {
                p.add(cb.equal(cb.lower(root.get("storyType")), type.trim().toLowerCase()));
            }
            if (action != null && !action.isBlank()) {
                try {
                    p.add(cb.equal(root.get("action"), AuditLog.Action.valueOf(action.trim().toUpperCase())));
                } catch (IllegalArgumentException ignored) {
                    p.add(cb.disjunction());
                }
            }
            if (user != null && !user.isBlank()) {
                p.add(cb.like(cb.lower(root.get("userName")), "%" + user.trim().toLowerCase() + "%"));
            }
            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                p.add(cb.or(
                    cb.like(cb.lower(root.get("storyKey")), like),
                    cb.like(cb.lower(root.get("storyTitle")), like),
                    cb.like(cb.lower(root.get("details")), like)
                ));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
        int safeSize = Math.max(1, Math.min(size, 100));
        Page<AuditLog> result = auditLogRepository.findAll(spec,
            PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "createdAt", "id")));
        return ResponseEntity.ok(Map.of(
            "content", result.getContent(),
            "page", result.getNumber(),
            "size", result.getSize(),
            "totalElements", result.getTotalElements(),
            "totalPages", result.getTotalPages()
        ));
    }
}
