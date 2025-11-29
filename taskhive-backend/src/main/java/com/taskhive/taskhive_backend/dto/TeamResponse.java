package com.taskhive.taskhive_backend.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TeamResponse {
    private Long id;
    private String name;
    private String description;
    private List<String> members;
    private LocalDateTime createdAt;
    
    public TeamResponse(Long id, String name, String description, List<String> members, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.members = members;
        this.createdAt = createdAt;
    }
}