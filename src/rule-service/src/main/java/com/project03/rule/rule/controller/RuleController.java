package com.project03.rule.rule.controller;

import com.project03.rule.rule.dto.azure.AzureAuthInfo;
import com.project03.rule.rule.dto.rule.RulesRequest;
import com.project03.rule.rule.dto.rule.RulesUpdateRequest;
import com.project03.rule.rule.service.RuleService;
import com.project03.rule.rule.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class RuleController {

    private final UserService userService;
    private final RuleService ruleService;

    @GetMapping("/api/rule/rule-sets")
    public ResponseEntity<String> getRuleSets(@RequestParam String userId, @RequestParam String resourceGroupName, @RequestParam String policyName) {
        //1. Azure API Key 갱신
        userService.getAzureApiKey(userId);

        //2. Azure 권한 정보 조회
        AzureAuthInfo authInfo = userService.getAzureInfo(userId);

        RulesRequest request = new RulesRequest(userId,resourceGroupName,policyName);

        return ruleService.getFrontDoorProfile(request, authInfo);
    }

    @PutMapping("/api/rule/rule-sets")
    public ResponseEntity<String> updateRuleSets(@RequestBody RulesUpdateRequest request) {
        //1. Azure API Key 갱신
        userService.getAzureApiKey(request.getUserId());

        //2. Azure 권한 정보 조회
        AzureAuthInfo authInfo = userService.getAzureInfo(request.getUserId());

        ResponseEntity<String> apiResult = ruleService.getFrontDoorProfile(new RulesRequest(request.getUserId(), request.getResourceGroupName(), request.getPolicyName()), authInfo);

        // ResponseEntity.status(countryService.updateCountryPolicy(apiResult, request, authInfo).getStatusCode()).build();
        return ResponseEntity.status(ruleService.updateRules(apiResult,request, authInfo).getStatusCode()).build();
    }




}
