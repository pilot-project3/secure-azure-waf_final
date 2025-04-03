package com.project03.country.country.dto.country;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CountryUpdateRequest {
    private String userId;
    private String resourceGroupName;
    private String policyName;
    private List<Rule> rules;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Rule {
        private String ruleName;
        private String priority;
        private List<String> countryList;
    }
}
