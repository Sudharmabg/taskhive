package com.taskhive.taskhive_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/** One user's upvote on an idea (at most one per user per idea). */
@Entity
@Table(name = "idea_votes", uniqueConstraints = {
    @UniqueConstraint(name = "uk_idea_votes_idea_user", columnNames = {"idea_id", "user_id"})
})
@Data
@NoArgsConstructor
public class IdeaVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "idea_id", nullable = false)
    private Long ideaId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    public IdeaVote(Long ideaId, Long userId) {
        this.ideaId = ideaId;
        this.userId = userId;
    }
}
