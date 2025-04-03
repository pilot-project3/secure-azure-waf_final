package com.project03.rule.rule.dto.rule;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RulesRequest {
    private String userId;
    private String resourceGroupName;
    private String policyName;
}
