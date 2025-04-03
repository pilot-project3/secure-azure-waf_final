package com.project03.waf.waf.dto.frontdoor;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FrontDoorRequest {
    private String userId;
    private String profileName;
    private String resourceGroupName;
}
