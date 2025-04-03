package com.project03.rule.rule.dto.rule;

import lombok.Data;

import java.util.List;

@Data
public class RulesUpdateRequest {
    private String userId;
    private List<String> blockRuleList;
    private String resourceGroupName;
    private String policyName;
}
