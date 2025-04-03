package com.project03.waf.waf.dto.resource;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ResourcesRequest {
    private String userId;
    private String resourceGroupName;
}
