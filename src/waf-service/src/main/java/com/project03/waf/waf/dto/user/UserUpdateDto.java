package com.project03.waf.waf.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserUpdateDto {
    private String webSiteUrl;
    private String resourceGroupName;
    private String wafPolicyName;
    private String workSpaceID;
    private String role;
}
