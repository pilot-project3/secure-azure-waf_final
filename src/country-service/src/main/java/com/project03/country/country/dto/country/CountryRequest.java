package com.project03.country.country.dto.country;

import lombok.Data;


@Data
public class CountryRequest {
    private String userId;
    private String resourceGroupName;
    private String policyName;

    public CountryRequest(String userId, String resourceGroupName, String policyName) {
        this.userId = userId;
        this.resourceGroupName = resourceGroupName;
        this.policyName = policyName;
    }
}
