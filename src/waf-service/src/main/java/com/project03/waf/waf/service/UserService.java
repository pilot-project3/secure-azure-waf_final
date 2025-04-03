package com.project03.waf.waf.service;

import com.project03.waf.waf.dto.azure.AzureAuthInfo;
import com.project03.waf.waf.dto.rule.RuleSetsUpdateDto;
import com.project03.waf.waf.dto.user.UserUpdateDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final RestTemplate restTemplate;

    public void fecthUserApiKey(String userId) {
        String url = "http://user-service:8080/api/v1/users/waf-api-key";

        // 요청 바디 생성 (JSON)
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("userId", userId);

        // 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 요청 객체 생성
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        // POST 요청 보내기
        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Map.class
        );
    }

    public AzureAuthInfo getAzureInfo(String userId) {
        String url = "http://user-service:8080/api/v1/users/" + userId;

        // Map으로 응답 받기
        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        Map<String, Object> responseBody = response.getBody();

        // "user" 키의 값이 多시 Map으로 감싸져 있으므로 꺼내기
        Map<String, Object> userMap = (Map<String, Object>) responseBody.get("user");

        // 필요한 값만 추출
        String clientId = (String) userMap.get("clientId");
        String clientSecret = (String) userMap.get("clientSecret");
        String wafApiKey = (String) userMap.get("wafApiKey");
        String subscriptionId = (String) userMap.get("subscriptionID");
        String tenantId = (String) userMap.get("tenantID");
        String webSiteUrl = (String) userMap.get("webSiteUrl");

        // AzureAuthInfo에 매핑
        AzureAuthInfo authInfo = new AzureAuthInfo();
        authInfo.setClientId(clientId);
        authInfo.setClientSecret(clientSecret);
        authInfo.setApiKey(wafApiKey);
        authInfo.setSubscriptionId(subscriptionId);
        authInfo.setTenantId(tenantId);
        authInfo.setWebSiteUrl(webSiteUrl);

        return authInfo;
    }

    public void updateUser(String userId, String apiKey, UserUpdateDto userUpdateDto) {
        // 요청할 URI (baseUrl 이후 경로만)
        String uri = "/api/v1/users/update/" + userId;

        // WebClient 인스턴스 생성
        WebClient webClient = WebClient.builder()
                .baseUrl("http://user-service:8080")
                .build();
        webClient.patch()
                .uri(uri)
                .headers(headers -> {
                    headers.setBearerAuth(apiKey); // Bearer 인증 토큰 설정
                    headers.setContentType(MediaType.APPLICATION_JSON); // Content-Type 설정
                })
                .bodyValue(userUpdateDto) // 요청 바디 설정
                .retrieve()
                .bodyToMono(Void.class) // 반환 없음
                .block(); // 동기 실행

    }


}
