package com.project03.country.country.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.project03.country.country.dto.azure.AzureAuthInfo;
import com.project03.country.country.dto.country.CountryRequest;
import com.project03.country.country.dto.country.CountryUpdateRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;


import java.util.List;

@Service
public class CountryService {

    public ResponseEntity<String> getCountryPolicyInfo(CountryRequest request, AzureAuthInfo authInfo)  {
        // 1. URL
        String url = "https://management.azure.com/subscriptions/" + authInfo.getSubscriptionId()+ "/resourceGroups/" + request.getResourceGroupName()
                + "/providers/Microsoft.Network/FrontDoorWebApplicationFirewallPolicies/" + request.getPolicyName() + "/?api-version=2022-05-01";

        // 2. 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(authInfo.getApiKey());
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 3. API 요청
        HttpEntity<Void> apiRequest = new HttpEntity<>(headers);
        RestTemplate restTemplate = new RestTemplate();
        return restTemplate.exchange(url, HttpMethod.GET, apiRequest, String.class);

    }

    public ResponseEntity<String> updateCountryPolicy(ResponseEntity<String> apiResult, CountryUpdateRequest request , AzureAuthInfo authInfo)  {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode root = objectMapper.readTree(apiResult.getBody());

            List<CountryUpdateRequest.Rule> rules = request.getRules();
            if (rules != null && !rules.isEmpty()) {
                ArrayNode customRulesArray = objectMapper.createArrayNode();

                for (CountryUpdateRequest.Rule ruleInfo : rules) {
                    ObjectNode rule = objectMapper.createObjectNode();
                    rule.put("name", ruleInfo.getRuleName()); // 각 룰의 이름
                    rule.put("enabledState", "Enabled");
                    rule.put("priority", ruleInfo.getPriority());
                    rule.put("ruleType", "MatchRule");
                    rule.put("rateLimitDurationInMinutes", 1);
                    rule.put("rateLimitThreshold", 100);
                    rule.put("action", "Block");

                    // matchConditions 설정
                    ArrayNode matchConditions = objectMapper.createArrayNode();
                    ObjectNode condition = objectMapper.createObjectNode();
                    condition.put("matchVariable", "SocketAddr");
                    condition.putNull("selector");
                    condition.put("operator", "GeoMatch");
                    condition.put("negateCondition", false);

                    // 국가 리스트 설정
                    ArrayNode matchValue = objectMapper.createArrayNode();
                    for (String code : ruleInfo.getCountryList()) {
                        matchValue.add(code.toUpperCase());
                    }
                    condition.set("matchValue", matchValue);
                    condition.set("transforms", objectMapper.createArrayNode());

                    matchConditions.add(condition);
                    rule.set("matchConditions", matchConditions);

                    // 룰 추가
                    customRulesArray.add(rule);
                }

                // customRules 반영
                ObjectNode customRulesNode = objectMapper.createObjectNode();
                customRulesNode.set("rules", customRulesArray);
                ((ObjectNode) root.path("properties")).set("customRules", customRulesNode);
            }

            // JSON 문자열로 변환
            String updatedBody = objectMapper.writeValueAsString(root);

            String url = "https://management.azure.com/subscriptions/" + authInfo.getSubscriptionId() +
                    "/resourceGroups/" + request.getResourceGroupName() +
                    "/providers/Microsoft.Network/FrontDoorWebApplicationFirewallPolicies/" + request.getPolicyName() +
                    "?api-version=2022-05-01";

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(authInfo.getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);


            HttpEntity<String> apiRequest = new HttpEntity<>(updatedBody, headers);
            RestTemplate restTemplate = new RestTemplate();

            // API 요청 후 응답 받기
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.PUT, apiRequest, String.class);

            // 응답 헤더 출력
            HttpHeaders responseHeaders = response.getHeaders();
            System.out.println("Response Headers: " + responseHeaders.toString());

            // 응답 반환
            return response;

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("오류 발생: " + e.getMessage());
        }
    }
}
