package com.project03.country.country.dto.azure;

import lombok.Data;

@Data
public class AzureAuthInfo {
    private String tenantId;
    private String subscriptionId;
    private String clientId;
    private String clientSecret;
    private String apiKey;
    private String webSiteUrl;
}
