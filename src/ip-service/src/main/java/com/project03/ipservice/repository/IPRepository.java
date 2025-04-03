package com.project03.ipservice.repository;

import com.project03.ipservice.entity.IP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IPRepository extends JpaRepository<IP, Long> {
    // 추가적인 쿼리 메서드는 필요에 따라 여기에 정의할 수 있습니다.
    public IP findByIpAddress(String ipAddress);
}