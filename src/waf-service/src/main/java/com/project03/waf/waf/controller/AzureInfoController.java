package com.project03.waf.waf.controller;

import com.project03.waf.waf.dto.azure.AzureAuthInfo;
import com.project03.waf.waf.dto.frontdoor.FrontDoorRequest;
import com.project03.waf.waf.dto.frontdoor.FrontDoorResponse;
import com.project03.waf.waf.dto.resource.ResourcesRequest;
import com.project03.waf.waf.dto.resource.ResourcesResponse;
import com.project03.waf.waf.dto.resourceGroup.ResourceGroupsRequest;
import com.project03.waf.waf.dto.resourceGroup.ResourceGroupsResponse;
import com.project03.waf.waf.dto.subscription.SubscriptionRequest;
import com.project03.waf.waf.dto.subscription.SubscriptionResponse;
import com.project03.waf.waf.service.AzureInfoService;
import com.project03.waf.waf.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class AzureInfoController {

    private final UserService userService; // userService에서 API 키 받아온다고 가정
    private final AzureInfoService azureInfoService;

    @GetMapping("/api/waf/subscription")
    public ResponseEntity<SubscriptionResponse> readSubscription (@RequestParam String userId)  {

        //1. Azure API Key 갱신
        userService.fecthUserApiKey(userId);

        //2. Azure 권한 정보 조회
        AzureAuthInfo authInfo = userService.getAzureInfo(userId);

        //3. 구독 정보 조회
        ResponseEntity<SubscriptionResponse> response = azureInfoService.getSubscription(authInfo);

        return ResponseEntity.ok(response.getBody());
    }

    @GetMapping("/api/waf/resource-groups")
    public ResponseEntity<List<ResourceGroupsResponse>> getResourceGroups (@RequestParam String userId) throws IOException {
        //1. Azure API Key 갱신
        userService.fecthUserApiKey(userId);

        //2. Azure 권한 정보 조회
        AzureAuthInfo authInfo = userService.getAzureInfo(userId);

        //3. ResourceGroups 조회
        return ResponseEntity.ok(azureInfoService.getResourceGroups(authInfo));
    }

    @GetMapping("/api/waf/resource-group/resources")
    public ResponseEntity<List<ResourcesResponse>> getResources (@RequestParam String userId, @RequestParam String resourceGroupName) throws IOException {
        //1. Azure API Key 갱신
        userService.fecthUserApiKey(userId);

        //2. Azure 권한 정보 조회
        AzureAuthInfo authInfo = userService.getAzureInfo(userId);

        ResourcesRequest request = new ResourcesRequest(userId,resourceGroupName);

        //3. ResourceGroups 조회
        return ResponseEntity.ok(azureInfoService.getResources(request, authInfo));
    }

    @GetMapping("/api/waf/front-door")
    public ResponseEntity<FrontDoorResponse> getFrontDoorProfile (@RequestParam String userId, @RequestParam String profileName, @RequestParam String resourceGroupName) throws IOException {
        //1. Azure API Key 갱신
        userService.fecthUserApiKey(userId);

        //2. Azure 권한 정보 조회
        AzureAuthInfo authInfo = userService.getAzureInfo(userId);

        FrontDoorRequest request = new FrontDoorRequest(userId,profileName,resourceGroupName);

        //3. ResourceGroups 조회
        return ResponseEntity.ok(azureInfoService.getFrontDoorProfile(request, authInfo));
    }

}
