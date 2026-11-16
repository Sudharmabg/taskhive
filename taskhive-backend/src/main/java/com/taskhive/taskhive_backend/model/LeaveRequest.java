package com.taskhive.taskhive_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** A user's request for time off; admins approve or reject it. */
@Entity
@Table(name = "leave_requests", indexes = {
    @Index(name = "idx_leave_requests_company", columnList = "company_id"),
    @Index(name = "idx_leave_requests_user", columnList = "user_id"),
    @Index(name = "idx_leave_requests_dates", columnList = "start_date, end_date")
})
@Data
@NoArgsConstructor
public class LeaveRequest {

    public enum Type { CASUAL, SICK, EARNED, UNPAID }

    public enum Status { PENDING, APPROVED, REJECTED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_name", length = 100)
    private String userName;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_type", nullable = false, length = 20)
    private Type type;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /** Only allowed for single-day leave. */
    @Column(name = "half_day", nullable = false)
    private boolean halfDay;

    /** Working days (Mon-Fri) covered; 0.5 for a half day. */
    @Column(nullable = false, precision = 5, scale = 1)
    private BigDecimal days;

    @Column(length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_by_name", length = 100)
    private String reviewedByName;

    @Column(name = "review_note", length = 500)
    private String reviewNote;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
