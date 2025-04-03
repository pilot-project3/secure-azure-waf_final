package com.project03.waf.waf.controller;

import com.project03.waf.waf.dto.azure.AzureAuthInfo;
import com.project03.waf.waf.dto.terraform.TerraformRequest;
import com.project03.waf.waf.service.TerraformService;
import com.project03.waf.waf.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;


@RestController
@RequiredArgsConstructor
public class TerraformController {

    private final TerraformService terraformService;
    private final UserService userService;

    @PostMapping("/api/waf/register")
    public ResponseEntity<String> runTerraform(@RequestBody TerraformRequest request) {

        // 1. Azure API Key 갱신
        userService.fecthUserApiKey(request.getUserId());

        // 2. Azure 권한 정보 조회
        AzureAuthInfo authInfo = userService.getAzureInfo(request.getUserId());

        // 3. Terraform 비동기 실행 시작 (WebSocket 로그 실시간 전송 포함)
        terraformService.executeTerraformAsync(request, authInfo);


        return ResponseEntity.ok("Terraform 실행이 시작되었습니다. 실시간 로그를 확인하세요.");
    }
}