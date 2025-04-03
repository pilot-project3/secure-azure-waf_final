package com.project03.waf.waf.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project03.waf.waf.dto.azure.AzureAuthInfo;
import com.project03.waf.waf.dto.frontdoor.FrontDoorRequest;
import com.project03.waf.waf.dto.frontdoor.FrontDoorResponse;
import com.project03.waf.waf.dto.resource.ResourcesRequest;
import com.project03.waf.waf.dto.resource.ResourcesResponse;
import com.project03.waf.waf.dto.resourceGroup.ResourceGroupsResponse;
import com.project03.waf.waf.dto.subscription.SubscriptionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AzureInfoService {

    private final RestTemplate restTemplate;

    public ResponseEntity<SubscriptionResponse> getSubscription(AzureAuthInfo authInfo){
        // 1. URL
        String url = "https://management.azure.com/subscriptions/" + authInfo.getSubscriptionId() + "?api-version=2024-11-01";

        // 2. 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(authInfo.getApiKey());
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 3. API 요청
        HttpEntity<Void> apiRequest = new HttpEntity<>(headers);

        return restTemplate.exchange(
                url,
                HttpMethod.GET,
                apiRequest,
                SubscriptionResponse.class
        );
    }

    public List<ResourceGroupsResponse> getResourceGroups(AzureAuthInfo authInfo) throws IOException {
        // 1. URL
        String url = "https://management.azure.com/subscriptions/" + authInfo.getSubscriptionId()+ "/resourcegroups?api-version=2021-04-01";

        // 2. 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(authInfo.getApiKey());
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 3. API 요청
        HttpEntity<Void> apiRequest = new HttpEntity<>(headers);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, apiRequest, String.class);

        // 3. 결과 반환
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode valueNode = root.get("value");

        return objectMapper.readerForListOf(ResourceGroupsResponse.class).readValue(valueNode);

    }

    public List<ResourcesResponse> getResources(ResourcesRequest request , AzureAuthInfo authInfo) throws IOException {
        // 1. URL
        String url = "https://management.azure.com/subscriptions/" + authInfo.getSubscriptionId()+ "/resourceGroups/" + request.getResourceGroupName() + "/resources?api-version=2021-04-01";

        // 2. 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(authInfo.getApiKey());
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 3. API 요청
        HttpEntity<Void> apiRequest = new HttpEntity<>(headers);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, apiRequest, String.class);

        // 3. 결과 반환
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode valueNode = root.get("value");

        return objectMapper.readerForListOf(ResourcesResponse.class).readValue(valueNode);

    }

    public FrontDoorResponse getFrontDoorProfile(FrontDoorRequest request , AzureAuthInfo authInfo) throws IOException {
        // 1. URL
        String url = "https://management.azure.com/subscriptions/" + authInfo.getSubscriptionId()+ "/resourceGroups/" + request.getResourceGroupName()
                + "/providers/Microsoft.Cdn/profiles/" + request.getProfileName() + "/?api-version=2023-05-01";

        // 2. 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(authInfo.getApiKey());
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 3. API 요청
        HttpEntity<Void> apiRequest = new HttpEntity<>(headers);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, apiRequest, String.class);

        // 4. 응답 파싱
        ObjectMapper objectMapper = new ObjectMapper();
        return objectMapper.readValue(response.getBody(), FrontDoorResponse.class);

    }
}
