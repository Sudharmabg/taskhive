package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    
    Optional<Company> findByCode(String code);
    
    Optional<Company> findByDomain(String domain);
    
    boolean existsByCode(String code);
    
    boolean existsByName(String name);
}