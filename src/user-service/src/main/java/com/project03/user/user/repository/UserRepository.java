package com.project03.user.user.repository;

import com.project03.user.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByLoginId(String loginId);
    Optional<User> findByLoginId(String loginId);
    Optional<User> findByLoginIdAndPassword(String loginId, String password);
}
