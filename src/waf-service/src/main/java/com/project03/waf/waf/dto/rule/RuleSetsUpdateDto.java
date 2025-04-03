package com.project03.waf.waf.dto.rule;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Data
@AllArgsConstructor
public class RuleSetsUpdateDto {
        private String userId;
        private final List<String> blockRuleList = Arrays.asList(
                "MS-ThreatIntel-WebShells",
                "MS-ThreatIntel-AppSec",
                "MS-ThreatIntel-SQLI",
                "MS-ThreatIntel-CVEs",
                "PROTOCOL-ATTACK",
                "LFI",
                "RFI",
                "RCE",
                "PHP",
                "XSS",
                "SQLI",
                "FIX",
                "JAVA",
                "METHOD-ENFORCEMENT",
                "PROTOCOL-ENFORCEMENT",
                "General",
                "NODEJS"
        );


        private String resourceGroupName;
        private String policyName;
}
