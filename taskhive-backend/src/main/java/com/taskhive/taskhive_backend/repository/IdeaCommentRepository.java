package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.IdeaComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IdeaCommentRepository extends JpaRepository<IdeaComment, Long> {
    List<IdeaComment> findByIdeaIdOrderByCreatedAtAsc(Long ideaId);
    long countByIdeaId(Long ideaId);
    void deleteByIdeaId(Long ideaId);
    void deleteByParentId(Long parentId);
}
