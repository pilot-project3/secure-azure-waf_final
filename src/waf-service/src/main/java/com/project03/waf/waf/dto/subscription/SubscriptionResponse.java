package com.project03.waf.waf.dto.subscription;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class SubscriptionResponse {
    private String id;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("displayName")
    private String displayName;

}
