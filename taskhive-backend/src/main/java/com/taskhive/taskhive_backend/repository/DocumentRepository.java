package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    /** Each tag used in the company with how many documents carry it, most used first. */
    @Query("SELECT t, COUNT(d) FROM Document d JOIN d.tags t WHERE d.companyId = :companyId "
         + "GROUP BY t ORDER BY COUNT(d) DESC, t ASC")
    List<Object[]> countTags(@Param("companyId") Long companyId);
}
