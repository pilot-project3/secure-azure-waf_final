package com.project03.user.user.dto;

import lombok.Getter;
import lombok.Setter;
import com.project03.user.user.entity.User;

@Getter
@Setter
public class UpdateUserRequest {
    private String loginId;
    private String password;
    private String sessionValue;

    private String tenantId;
    private String role;
    private String subscriptionID;
    private String workSpaceID;

    private String clientId;
    private String clientSecret;
    private String scope;
    private String wafId;

    private String webSiteUrl;
    private String resourceGroupName;


    private String logApiKey;
    private Long logApiKeyExpiresAt;

    private String wafApiKey;
    private Long  wafApiKeyExpiresAt;

    private String aiInsight;
    private String wafPolicyName;

    public void applyTo(User user) {
        if (sessionValue != null) user.setSessionValue(sessionValue);
        if (tenantId != null) user.setTenantId(tenantId);
        if (role != null) user.setRole(role);
        if (subscriptionID != null) user.setSubscriptionID(subscriptionID);
        if (workSpaceID != null) user.setWorkSpaceID(workSpaceID);

        if (clientId != null) user.setClientId(clientId);
        if (clientSecret != null) user.setClientSecret(clientSecret);
        if (scope != null) user.setScope(scope);
        if (wafId != null) user.setWafId(wafId);

        if (webSiteUrl != null) user.setWebSiteUrl(webSiteUrl);
        if (resourceGroupName != null) user.setResourceGroupName(resourceGroupName);

        if (logApiKey != null) user.setLogApiKey(logApiKey);
        if (logApiKeyExpiresAt != null) user.setLogApiKeyExpiresAt(logApiKeyExpiresAt);

        if (wafApiKey != null) user.setWafApiKey(wafApiKey);
        if (wafApiKeyExpiresAt != null) user.setWafApiKeyExpiresAt(logApiKeyExpiresAt);

        if (aiInsight != null) user.setAiInsight(aiInsight);
        if (wafPolicyName != null) user.setWafPolicyName(wafPolicyName);
    }
}