package com.project03.rule.rule.service;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.project03.rule.rule.dto.azure.*;
import com.project03.rule.rule.dto.rule.RulesRequest;
import com.project03.rule.rule.dto.rule.RulesUpdateRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Service
public class RuleService {

    public ResponseEntity<String> getFrontDoorProfile(RulesRequest request , AzureAuthInfo authInfo)  {
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

    public ResponseEntity<String> updateRules(ResponseEntity<String> apiResult, RulesUpdateRequest request, AzureAuthInfo authInfo) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode root = objectMapper.readTree(apiResult.getBody());

            // ruleGroupMap.json 로딩
            InputStream mapStream = getClass().getResourceAsStream("/ruleGroupMap.json");
            Map<String, List<String>> ruleGroupMap = objectMapper.readValue(mapStream, new TypeReference<>() {});

            // managedRuleSets 탐색
            JsonNode managedRules = root.at("/properties/managedRules/managedRuleSets");
            if (managedRules.isArray()) {
                for (JsonNode ruleSet : managedRules) {
                    if ("Microsoft_DefaultRuleSet".equals(ruleSet.path("ruleSetType").asText())) {
                        // 항상 ruleGroupOverrides를 초기화
                        ArrayNode newOverrides = objectMapper.createArrayNode();

                        List<String> blockGroupList = request.getBlockRuleList();

                        for (Map.Entry<String, List<String>> entry : ruleGroupMap.entrySet()) {
                            String groupName = entry.getKey();
                            List<String> ruleIds = entry.getValue();
                            if (ruleIds == null || ruleIds.isEmpty()) continue;

                            ObjectNode groupNode = objectMapper.createObjectNode();
                            groupNode.put("ruleGroupName", groupName);

                            ArrayNode rulesArray = objectMapper.createArrayNode();
                            boolean isBlocked = blockGroupList != null && blockGroupList.contains(groupName);

                            for (String ruleId : ruleIds) {
                                ObjectNode rule = objectMapper.createObjectNode();
                                rule.put("ruleId", ruleId);
                                rule.put("enabledState", isBlocked ? "Enabled" : "Disabled");
                                rule.put("action","AnomalyScoring");
                                rule.set("exclusions", objectMapper.createArrayNode());
                                rulesArray.add(rule);
                            }

                            groupNode.set("rules", rulesArray);
                            groupNode.set("exclusions", objectMapper.createArrayNode());
                            newOverrides.add(groupNode);
                        }

                        // 덮어쓰기
                        ((ObjectNode) ruleSet).set("ruleGroupOverrides", newOverrides);
                        break;
                    }
                }
            }

            // 수정된 JSON으로 PUT 요청
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
            return restTemplate.exchange(url, HttpMethod.PUT, apiRequest, String.class);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("오류 발생: " + e.getMessage());
        }
    }




}
