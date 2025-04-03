package com.project03.user.user.service;

import com.project03.user.user.dto.*;
import com.project03.user.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import com.project03.user.user.entity.User;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;


    public UserResponse join(JoinRequest req, HttpServletRequest request, HttpServletResponse response) {
        if (userRepository.existsByLoginId(req.getLoginId())) {
            throw new IllegalArgumentException("이미 사용 중인 로그인 ID입니다.");
        }

        User savedUser = userRepository.save(req.toEntity());

        return UserResponse.from(savedUser);
    }


    public UserResponse login(LoginRequest req, HttpServletRequest request, HttpServletResponse response) {

        Optional<User> userOpt = userRepository.findByLoginIdAndPassword(req.getLoginId(), req.getPassword());
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 로그인 ID입니다.");
        }

        return UserResponse.from(userOpt.get());
    }

    public UserResponse updateUserByLoginIdAndPassword(UpdateUserRequest req) {
        User user = userRepository.findByLoginIdAndPassword(req.getLoginId(), req.getPassword())
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        req.applyTo(user); // 모든 업데이트 로직이 DTO에 위임됨

        return UserResponse.from(userRepository.save(user));
    }

    public ApiKeyResponse getWafApiKey(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 ID의 유저를 찾을 수 없습니다."));

        long now = System.currentTimeMillis();
        if (user.getWafApiKey() != null && user.getWafApiKeyExpiresAt() != null && user.getWafApiKeyExpiresAt() > now) {
            System.out.println("기존값");
            return new ApiKeyResponse(user.getWafApiKey()); // 기존 키 반환
        }

        // 새 access token 요청
        String tokenUrl = "https://login.microsoftonline.com/" + user.getTenantId() + "/oauth2/v2.0/token";

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("client_id", user.getClientId());
        formData.add("client_secret", user.getClientSecret());
        formData.add("scope", "https://management.azure.com/.default");
        formData.add("grant_type", "client_credentials");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(formData, headers);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                tokenUrl, HttpMethod.POST, requestEntity, new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        if (response.getStatusCode() != HttpStatus.OK) {
            throw new RuntimeException("토큰 요청 실패: " + response.getStatusCode());
        }

        Map<String, Object> body = response.getBody();
        String accessToken = (String) body.get("access_token");
        Integer expiresIn = (Integer) body.get("expires_in"); // 보통 3600

        if (accessToken == null || expiresIn == null) {
            throw new RuntimeException("access_token 또는 expires_in 없음");
        }

        // 유저에 accessToken과 만료 시간 저장
        user.setWafApiKey(accessToken);
        user.setWafApiKeyExpiresAt(now + expiresIn * 1000L);
        userRepository.save(user);

        return new ApiKeyResponse(accessToken);
    }

    public ApiKeyResponse getLogApiKey(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 ID의 유저를 찾을 수 없습니다."));

        long now = System.currentTimeMillis();

        if (user.getLogApiKey() != null
                && user.getLogApiKeyExpiresAt() != null
                && user.getLogApiKeyExpiresAt() > now) {
            System.out.println("기존값");
            return new ApiKeyResponse(user.getLogApiKey()); // 기존 키 반환
        }

        // 새 access token 요청
        String tokenUrl = "https://login.microsoftonline.com/" + user.getTenantId() + "/oauth2/token";

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("client_id", user.getClientId());
        formData.add("client_secret", user.getClientSecret());
        formData.add("resource", "https://api.loganalytics.io");
        formData.add("grant_type", "client_credentials");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(formData, headers);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                tokenUrl, HttpMethod.POST, requestEntity, new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        if (response.getStatusCode() != HttpStatus.OK) {
            throw new RuntimeException("토큰 요청 실패: " + response.getStatusCode());
        }

        Map<String, Object> body = response.getBody();
        String accessToken = (String) body.get("access_token");

        Object expiresObj = body.get("ext_expires_in");
        long expiresIn;

        if (expiresObj instanceof Integer) {
            expiresIn = ((Integer) expiresObj).longValue();
        } else if (expiresObj instanceof String) {
            expiresIn = Long.parseLong((String) expiresObj);
        } else if (expiresObj instanceof Long) {
            expiresIn = (Long) expiresObj;
        } else {
            throw new RuntimeException("ext_expires_in 타입 예외: " + expiresObj.getClass());
        }

        if (accessToken == null) {
            throw new RuntimeException("access_token 없음");
        }

        user.setLogApiKey(accessToken);
        user.setLogApiKeyExpiresAt(now + expiresIn * 1000L);
        userRepository.save(user);
        return new ApiKeyResponse(accessToken);
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 ID의 유저를 찾을 수 없습니다."));
    }

    public UserResponse updateUserById(UpdateUserRequest req, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        req.applyTo(user);

        return UserResponse.from(userRepository.save(user));
    }

    public String getAiInsightByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 ID의 유저를 찾을 수 없습니다."));
        return user.getAiInsight() != null ? user.getAiInsight() : "아직 AI 인사이트가 생성되지 않았습니다.";
    }
}
