package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByUserIdOrderByStartDateDescIdDesc(Long userId);

    List<LeaveRequest> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    List<LeaveRequest> findByCompanyIdAndStatusOrderByCreatedAtDesc(Long companyId, LeaveRequest.Status status);

    /** Requests of one user that overlap [from, to] in any of the given statuses. */
    @Query("SELECT l FROM LeaveRequest l WHERE l.userId = :userId AND l.status IN :statuses "
        + "AND l.startDate <= :to AND l.endDate >= :from")
    List<LeaveRequest> findOverlapping(@Param("userId") Long userId,
                                       @Param("statuses") Collection<LeaveRequest.Status> statuses,
                                       @Param("from") LocalDate from,
                                       @Param("to") LocalDate to);

    /** Leave in a company with the given status that overlaps [from, to]. */
    @Query("SELECT l FROM LeaveRequest l WHERE l.companyId = :companyId AND l.status = :status "
        + "AND l.startDate <= :to AND l.endDate >= :from ORDER BY l.startDate, l.userName")
    List<LeaveRequest> findByStatusBetween(@Param("companyId") Long companyId,
                                           @Param("status") LeaveRequest.Status status,
                                           @Param("from") LocalDate from,
                                           @Param("to") LocalDate to);
}
