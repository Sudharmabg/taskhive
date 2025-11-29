package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByPasswordResetToken(String token);
    
    List<User> findByCompanyId(Long companyId);
    
    Optional<User> findByCompanyIdAndEmployeeId(Long companyId, String employeeId);
    
    boolean existsByEmail(String email);
    
    boolean existsByCompanyIdAndEmployeeId(Long companyId, String employeeId);
    
    long countByCompanyId(Long companyId);
    
    List<User> findByTeamId(Long teamId);
}