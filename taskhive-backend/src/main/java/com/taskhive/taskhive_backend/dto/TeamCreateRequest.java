package com.taskhive.taskhive_backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class TeamCreateRequest {
    private String name;
    private String description;
    private List<String> members;
}