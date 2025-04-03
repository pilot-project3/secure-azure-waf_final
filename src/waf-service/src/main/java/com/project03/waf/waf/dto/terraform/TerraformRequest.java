package com.project03.waf.waf.dto.terraform;


import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class TerraformRequest {

    // Azure 서비스 프린시펄 인증 정보
    private String clientId;           // 클라이언트 ID
    private String clientSecret;       // 클라이언트 시크릿
    private String tenantId;           // 테넌트 ID
    private String subscriptionId;     // 구독 ID

    // 리소스 생성 관련 정보
    private String staticWebAppUrl;    // Static Web App의 URL
    private String resourceGroupName;  // 리소스 그룹 이름

    private String userId; // 사용자별 디렉토리 구분을 위한 필드
}