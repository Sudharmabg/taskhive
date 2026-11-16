package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.IdeaVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface IdeaVoteRepository extends JpaRepository<IdeaVote, Long> {

    Optional<IdeaVote> findByIdeaIdAndUserId(Long ideaId, Long userId);

    long countByIdeaId(Long ideaId);

    @Query("SELECT v.ideaId FROM IdeaVote v WHERE v.userId = :userId AND v.ideaId IN :ideaIds")
    List<Long> findVotedIdeaIds(@Param("userId") Long userId, @Param("ideaIds") Collection<Long> ideaIds);

    @Modifying
    @Transactional
    @Query("DELETE FROM IdeaVote v WHERE v.ideaId = :ideaId")
    void deleteByIdeaId(@Param("ideaId") Long ideaId);
}
