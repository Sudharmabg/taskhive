package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.LeaveRequest;
import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.repository.LeaveRequestRepository;
import com.taskhive.taskhive_backend.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;

/**
 * Leave requests. Any signed-in user applies for and cancels their own leave;
 * admins see every request in the company and approve or reject pending ones.
 */
@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
@Slf4j
public class LeaveController {

    private static final int MAX_BACKDATE_DAYS = 30;
    private static final int MAX_LENGTH_DAYS = 90;
    private static final int MAX_TEXT = 500;
    private static final List<LeaveRequest.Status> ACTIVE =
        List.of(LeaveRequest.Status.PENDING, LeaveRequest.Status.APPROVED);

    private final LeaveRequestRepository leaveRepository;
    private final CurrentUserService currentUserService;

    /** The caller's own requests plus days used this year by type. */
    @GetMapping("/mine")
    public ResponseEntity<?> mine() {
        User user = currentUserService.get().orElse(null);
        if (user == null) return error("You must be signed in");
        List<LeaveRequest> requests = leaveRepository.findByUserIdOrderByStartDateDescIdDesc(user.getId());

        int year = LocalDate.now().getYear();
        Map<String, Map<String, BigDecimal>> summary = new LinkedHashMap<>();
        for (LeaveRequest.Type type : LeaveRequest.Type.values()) {
            Map<String, BigDecimal> row = new LinkedHashMap<>();
            row.put("approved", BigDecimal.ZERO);
            row.put("pending", BigDecimal.ZERO);
            summary.put(type.name(), row);
        }
        for (LeaveRequest r : requests) {
            if (r.getStartDate().getYear() != year) continue;
            String bucket = r.getStatus() == LeaveRequest.Status.APPROVED ? "approved"
                : r.getStatus() == LeaveRequest.Status.PENDING ? "pending" : null;
            if (bucket != null) summary.get(r.getType().name()).merge(bucket, r.getDays(), BigDecimal::add);
        }
        return ResponseEntity.ok(Map.of("requests", requests, "summary", summary, "year", year));
    }

    /** All requests in the caller's company (admins only), optionally filtered by status. */
    @GetMapping
    public ResponseEntity<?> all(@RequestParam(required = false) String status) {
        User user = currentUserService.get().orElse(null);
        if (!CurrentUserService.isAdmin(user)) return error("Only admins can view all leave requests");
        Long companyId = user.getCompany().getId();
        if (status == null || status.isBlank()) {
            return ResponseEntity.ok(leaveRepository.findByCompanyIdOrderByCreatedAtDesc(companyId));
        }
        LeaveRequest.Status parsed = parseStatus(status);
        if (parsed == null) return error("Unknown status: " + status);
        return ResponseEntity.ok(leaveRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(companyId, parsed));
    }

    /** Who is on approved leave from today through the next {@code days} days. Visible to everyone. */
    @GetMapping("/upcoming")
    public ResponseEntity<?> upcoming(@RequestParam(defaultValue = "14") int days) {
        User user = currentUserService.get().orElse(null);
        if (user == null) return error("You must be signed in");
        LocalDate today = LocalDate.now();
        int span = Math.max(0, Math.min(days, 90));
        List<Map<String, Object>> result = new ArrayList<>();
        for (LeaveRequest r : leaveRepository.findByStatusBetween(
                user.getCompany().getId(), LeaveRequest.Status.APPROVED, today, today.plusDays(span))) {
            // Leave type and reason stay private; colleagues only see who is away and when
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", r.getId());
            row.put("userId", r.getUserId());
            row.put("userName", r.getUserName());
            row.put("startDate", r.getStartDate());
            row.put("endDate", r.getEndDate());
            row.put("halfDay", r.isHalfDay());
            row.put("onLeaveToday", !r.getStartDate().isAfter(today) && !r.getEndDate().isBefore(today));
            result.add(row);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> apply(@RequestBody Map<String, Object> body) {
        User user = currentUserService.get().orElse(null);
        if (user == null) return error("You must be signed in to apply for leave");

        LeaveRequest.Type type;
        try {
            type = LeaveRequest.Type.valueOf(String.valueOf(body.get("type")).trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return error("Choose a leave type");
        }
        LocalDate start = parseDate(body.get("startDate"));
        LocalDate end = parseDate(body.get("endDate"));
        if (start == null || end == null) return error("Enter valid start and end dates");
        if (end.isBefore(start)) return error("End date can't be before the start date");
        if (start.isBefore(LocalDate.now().minusDays(MAX_BACKDATE_DAYS))) {
            return error("Leave can be backdated by at most " + MAX_BACKDATE_DAYS + " days");
        }
        if (end.toEpochDay() - start.toEpochDay() + 1 > MAX_LENGTH_DAYS) {
            return error("A single request can cover at most " + MAX_LENGTH_DAYS + " days");
        }
        boolean halfDay = Boolean.TRUE.equals(body.get("halfDay"));
        if (halfDay && !start.equals(end)) return error("Half-day leave must start and end on the same day");

        int workingDays = workingDays(start, end);
        if (workingDays == 0) return error("These dates fall on a weekend; no leave is needed");
        String reason = trimToNull(body.get("reason"));
        if (reason != null && reason.length() > MAX_TEXT) return error("Reason must be " + MAX_TEXT + " characters or fewer");

        if (!leaveRepository.findOverlapping(user.getId(), ACTIVE, start, end).isEmpty()) {
            return error("You already have pending or approved leave on some of these dates");
        }

        LeaveRequest request = new LeaveRequest();
        request.setCompanyId(user.getCompany().getId());
        request.setUserId(user.getId());
        request.setUserName(user.getName());
        request.setType(type);
        request.setStartDate(start);
        request.setEndDate(end);
        request.setHalfDay(halfDay);
        request.setDays(halfDay ? new BigDecimal("0.5") : BigDecimal.valueOf(workingDays));
        request.setReason(reason);
        request.setStatus(LeaveRequest.Status.PENDING);
        LeaveRequest saved = leaveRepository.save(request);
        log.info("Leave request {} created by user {}: {} {}..{}", saved.getId(), user.getId(), type, start, end);
        return ResponseEntity.ok(saved);
    }

    /** Owner cancels pending leave, or approved leave that hasn't started. Admins can cancel any active leave. */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        User user = currentUserService.get().orElse(null);
        if (user == null) return error("You must be signed in");
        LeaveRequest request = leaveRepository.findById(id).orElse(null);
        if (request == null || !sameCompany(user, request)) return error("Leave request not found");

        boolean admin = CurrentUserService.isAdmin(user);
        if (!admin && !request.getUserId().equals(user.getId())) return error("You can only cancel your own leave");
        if (!ACTIVE.contains(request.getStatus())) return error("This request is already " + request.getStatus().name().toLowerCase());
        if (!admin && request.getStatus() == LeaveRequest.Status.APPROVED
                && !request.getStartDate().isAfter(LocalDate.now())) {
            return error("Approved leave that has already started can only be cancelled by an admin");
        }
        request.setStatus(LeaveRequest.Status.CANCELLED);
        if (admin && !request.getUserId().equals(user.getId())) {
            stampReview(request, user, "Cancelled by " + user.getName());
        }
        return ResponseEntity.ok(leaveRepository.save(request));
    }

    /** Admin approves or rejects a pending request. */
    @PostMapping("/{id}/review")
    public ResponseEntity<?> review(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        User user = currentUserService.get().orElse(null);
        if (!CurrentUserService.isAdmin(user)) return error("Only admins can approve or reject leave");
        LeaveRequest request = leaveRepository.findById(id).orElse(null);
        if (request == null || !sameCompany(user, request)) return error("Leave request not found");
        if (request.getStatus() != LeaveRequest.Status.PENDING) {
            return error("Only pending requests can be reviewed; this one is " + request.getStatus().name().toLowerCase());
        }
        LeaveRequest.Status decision = parseStatus(String.valueOf(body.get("decision")));
        if (decision != LeaveRequest.Status.APPROVED && decision != LeaveRequest.Status.REJECTED) {
            return error("Decision must be APPROVED or REJECTED");
        }
        String note = trimToNull(body.get("note"));
        if (note != null && note.length() > MAX_TEXT) return error("Note must be " + MAX_TEXT + " characters or fewer");
        if (decision == LeaveRequest.Status.APPROVED) {
            // Another request for the same dates may have been approved since this one was filed
            boolean clash = leaveRepository.findOverlapping(request.getUserId(), List.of(LeaveRequest.Status.APPROVED),
                    request.getStartDate(), request.getEndDate()).stream()
                .anyMatch(other -> !other.getId().equals(request.getId()));
            if (clash) return error(request.getUserName() + " already has approved leave on some of these dates");
        }
        request.setStatus(decision);
        stampReview(request, user, note);
        log.info("Leave request {} {} by user {}", id, decision, user.getId());
        return ResponseEntity.ok(leaveRepository.save(request));
    }

    /** Monday-Friday days between start and end, inclusive. */
    static int workingDays(LocalDate start, LocalDate end) {
        int count = 0;
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            if (d.getDayOfWeek() != DayOfWeek.SATURDAY && d.getDayOfWeek() != DayOfWeek.SUNDAY) count++;
        }
        return count;
    }

    private static void stampReview(LeaveRequest request, User reviewer, String note) {
        request.setReviewedBy(reviewer.getId());
        request.setReviewedByName(reviewer.getName());
        request.setReviewNote(note);
        request.setReviewedAt(LocalDateTime.now());
    }

    private static boolean sameCompany(User user, LeaveRequest request) {
        return user.getCompany() != null && Objects.equals(user.getCompany().getId(), request.getCompanyId());
    }

    private static LeaveRequest.Status parseStatus(String value) {
        try {
            return LeaveRequest.Status.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            return null;
        }
    }

    private static LocalDate parseDate(Object value) {
        if (value == null) return null;
        try {
            return LocalDate.parse(value.toString().trim());
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private static String trimToNull(Object value) {
        if (value == null) return null;
        String s = value.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private static ResponseEntity<?> error(String message) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", message));
    }
}
