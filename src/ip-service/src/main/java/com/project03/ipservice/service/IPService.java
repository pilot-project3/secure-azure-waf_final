package com.project03.ipservice.service;

import com.project03.ipservice.entity.IP;
import com.project03.ipservice.exception.AzureServiceException;
import com.project03.ipservice.repository.IPRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class IPService {

    private final IPRepository ipRepository;
    private final AzureService azureService;

    @Autowired
    public IPService(IPRepository ipRepository, AzureService azureService) {
        this.ipRepository = ipRepository;
        this.azureService = azureService;
    }

    /**
     * 모든 IP 규칙을 조회합니다.
     *
     * @return IP 규칙 목록
     */
    public List<IP> getAllIpRules() {
        return ipRepository.findAll();
    }

    /**
     * ID로 특정 IP 규칙을 조회합니다.
     *
     * @param id 조회할 IP 규칙 ID
     * @return IP 규칙 (없으면 null)
     */
    public Optional<IP> getIpRuleById(Long id) {
        return ipRepository.findById(id);
    }

    /**
     * 새로운 IP 규칙을 생성합니다.
     *
     * @param clientId     Azure Service Principal 클라이언트 ID
     * @param clientSecret Azure Service Principal 비밀 키
     * @param tenantId     Azure 테넌트 ID
     * @param ip           생성할 IP 엔티티
     * @return 생성된 IP 규칙
     */
    public IP createIpRule(IP ip) {
        try {
            // Azure WAF에 규칙 생성
            azureService.createWafRule(ip);

            // 생성된 WAF 규칙 ID 설정

            // DB에 저장
            return ipRepository.save(ip);
        } catch (Exception e) {
            throw new AzureServiceException("WAF 규칙 생성 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * IP 규칙을 삭제합니다.
     *
     * @param clientId     Azure Service Principal 클라이언트 ID
     * @param clientSecret Azure Service Principal 비밀 키
     * @param tenantId     Azure 테넌트 ID
     * @param id           삭제할 IP 규칙 ID
     */
    public void deleteIpRule(Long id) {
        // IP 규칙 조회
        Optional<IP> ipOptional = ipRepository.findById(id);

        if (ipOptional.isPresent()) {
            try {
                IP ip = ipOptional.get();
                // Azure WAF에서 규칙 삭제 (userId와 wafId 함께 전달)
                azureService.deleteWafRule(id, String.valueOf(ip.getUserId()), ip.getWafId());
                // DB에서 삭제
                ipRepository.deleteById(id);
            } catch (Exception e) {
                throw new AzureServiceException("WAF 규칙 삭제 중 오류가 발생했습니다: " + e.getMessage(), e);
            }
        } else {
            throw new RuntimeException("ID가 " + id + "인 IP 규칙을 찾을 수 없습니다.");
        }
    }

    /**
     * Azure WAF에서 특정 IP 주소에 대한 규칙을 조회합니다.
     *
     * @param clientId     Azure Service Principal 클라이언트 ID
     * @param clientSecret Azure Service Principal 비밀 키
     * @param tenantId     Azure 테넌트 ID
     * @param ipAddress    조회할 IP 주소
     * @return WAF 규칙 정보
     */
    public Map<String, Object> getWafRuleByIp(String ipAddress) {
        try {
            IP ip = new IP();
            ip = ipRepository.findByIpAddress(ipAddress);

            return azureService.getWafRuleByIp(ip);
        } catch (Exception e) {
            throw new AzureServiceException("WAF 규칙 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 모든 WAF 규칙을 삭제합니다.
     */
    public void deleteAllWafRules(String wafId, String userId) {
        try {
            azureService.deleteAllWafRules(wafId, userId);
            ipRepository.deleteAll();
        } catch (Exception e) {
            throw new AzureServiceException("WAF 규칙 전체 삭제 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    public IP createIpRuleByLog(IP ip, Integer priority) {
        try {
            // Azure WAF에 규칙 생성
            azureService.createWafRuleByLog(ip, priority);

            // 생성된 WAF 규칙 ID 설정

            // DB에 저장
            return ipRepository.save(ip);
        } catch (Exception e) {
            throw new AzureServiceException("WAF 규칙 생성 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
}