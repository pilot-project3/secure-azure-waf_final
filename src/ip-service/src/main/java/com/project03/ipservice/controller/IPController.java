package com.project03.ipservice.controller;

import com.project03.ipservice.entity.IP;
import com.project03.ipservice.exception.AzureServiceException;
import com.project03.ipservice.service.IPService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ip")
public class IPController {

    private final IPService ipService;

    @Autowired
    public IPController(IPService ipService) {
        this.ipService = ipService;
    }

    /**
     * 모든 IP 규칙을 조회합니다.
     *
     * @return IP 규칙 목록
     */
    @GetMapping
    public ResponseEntity<List<IP>> getAllIpRules() {
        List<IP> ipRules = ipService.getAllIpRules();
        return new ResponseEntity<>(ipRules, HttpStatus.OK);
    }

    /**
     * ID로 특정 IP 규칙을 조회합니다.
     *
     * @param id 조회할 IP 규칙 ID
     * @return IP 규칙
     */
    @GetMapping("/{id}")
    public ResponseEntity<IP> getIpRuleById(@PathVariable Long id) {
        Optional<IP> ipRule = ipService.getIpRuleById(id);
        return ipRule.map(ip -> new ResponseEntity<>(ip, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Azure WAF에서 특정 IP 주소에 대한 규칙을 조회합니다.
     *
     * @param ipAddress    조회할 IP 주소
     * @param clientId     Azure Service Principal 클라이언트 ID
     * @param clientSecret Azure Service Principal 비밀 키
     * @param tenantId     Azure 테넌트 ID
     * @return WAF 규칙 정보
     */
    @GetMapping("/waf")
    public ResponseEntity<Map<String, Object>> getWafRuleByIp(
            @RequestParam String ipAddress,
            @RequestParam String userId) {

        try {
            Map<String, Object> wafRule = ipService.getWafRuleByIp(ipAddress);
            return new ResponseEntity<>(wafRule, HttpStatus.OK);
        } catch (AzureServiceException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("ipAddress", ipAddress);
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 새로운 IP 규칙을 생성합니다.
     *
     * @param ip           생성할 IP 엔티티
     * @param clientId     Azure Service Principal 클라이언트 ID
     * @param clientSecret Azure Service Principal 비밀 키
     * @param tenantId     Azure 테넌트 ID
     * @return 생성된 IP 규칙
     */
    @PostMapping
    public ResponseEntity<?> createIpRule(
            @RequestParam String ip2,
            @RequestParam String action,
            @RequestParam String userId,
            @RequestParam String wafId) {
        IP ip = new IP();
        ip.setIpAddress(ip2);
        ip.setAction(action);
        ip.setUserId(Long.valueOf(userId));
        ip.setWafId(wafId);

        // 실제 프론트와 연결 시 action, ip 2개의 값이 넘어옴. 해당 변수로 create 예정

        try {
            IP createdIp = ipService.createIpRule(ip);
            return new ResponseEntity<>(createdIp, HttpStatus.CREATED);
        } catch (AzureServiceException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/log")
    public ResponseEntity<?> createIpRuleByLog(
            @RequestParam String ip2,
            @RequestParam String userId,
            @RequestParam String wafId,
            @RequestParam Integer priority) {
        IP ip = new IP();
        ip.setIpAddress(ip2);
        ip.setAction("Block");
        ip.setUserId(Long.valueOf(userId));
        ip.setWafId(wafId);

        // 실제 프론트와 연결 시 action, ip 2개의 값이 넘어옴. 해당 변수로 create 예정

        try {
            IP createdIp = ipService.createIpRuleByLog(ip, priority);
            return new ResponseEntity<>(createdIp, HttpStatus.CREATED);
        } catch (AzureServiceException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * IP 규칙을 삭제합니다.
     *
     * @param id           삭제할 IP 규칙 ID
     * @param clientId     Azure Service Principal 클라이언트 ID
     * @param clientSecret Azure Service Principal 비밀 키
     * @param tenantId     Azure 테넌트 ID
     * @return 삭제 상태
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteIpRule(
            @PathVariable Long id) {

        try {
            ipService.deleteIpRule(id);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "ID가 " + id + "인 IP 규칙이 성공적으로 삭제되었습니다.");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (AzureServiceException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
        }
    }

    /**
     * 모든 WAF 규칙을 삭제합니다.
     *
     * @return 삭제 상태
     */
    @DeleteMapping("/all")
    public ResponseEntity<?> deleteAllWafRules(@RequestBody Map<String, String> requestBody) {
        try {
            ipService.deleteAllWafRules(requestBody.get("wafId"), requestBody.get("userId"));
            Map<String, Object> response = new HashMap<>();
            response.put("message", "모든 WAF 규칙이 성공적으로 삭제되었습니다.");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (AzureServiceException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}