package com.project03.user.user.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "\"user\"")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 로그인 정보
    private String loginId;        // 사용자 ID
    private String password;        // 비밀번호 (암호화 저장 권장)
    private String sessionValue;    // 세션 값

    // 유저가 수기로 넘겨주는 Service Principal 정보 정보
    private String tenantId;
    private String role;
    private String subscriptionID;
    private String workSpaceID;

    private String clientId;
    private String clientSecret;
    private String scope;
    private String wafId;

    private String webSiteUrl;
    private String resourceGroupName;
    private String wafPolicyName;

    @Lob
    private String wafApiKey;
    private Long wafApiKeyExpiresAt; // 유닉스 타임스탬프로 저장 (예: System.currentTimeMillis() + expiresIn * 1000)

    @Lob
    private String logApiKey;
    private Long logApiKeyExpiresAt;

    @Lob
    private String aiInsight;
}