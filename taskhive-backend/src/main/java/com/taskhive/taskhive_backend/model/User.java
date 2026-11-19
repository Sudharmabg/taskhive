package com.taskhive.taskhive_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Company company;
    
    @Column(name = "employee_id", nullable = false, length = 50)
    private String employeeId;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(unique = true, nullable = false, length = 100)
    private String email;
    
    /** BCrypt hash; never sent to the browser. */
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(length = 255)
    private String password;
    
    @Column(length = 100)
    private String designation;
    
    /**
     * One of {@link #STANDARD_JOB_ROLES} or a custom role typed by an admin.
     */
    @Column(name = "job_role", length = 50)
    private String jobRole;
    
    @Column(name = "team_id")
    private Long teamId;
    
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Role role = Role.USER;
    
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.PENDING;
    
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "password_reset_token", length = 255)
    private String passwordResetToken;
    
    @Column(name = "password_reset_expires")
    private LocalDateTime passwordResetExpires;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /** Preset job roles offered in the forms; any other text is a custom role. */
    public static final java.util.List<String> STANDARD_JOB_ROLES =
        java.util.List.of("UI", "BE", "QA", "DevOps", "FullStack", "AI");
    
    public enum Role {
        ADMIN, USER
    }
    
    public enum Status {
        PENDING, ACTIVE, INACTIVE
    }
}