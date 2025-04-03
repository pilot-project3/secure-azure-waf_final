package com.project03.waf.waf.dto.resource;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true) // JSON에 있는 불필요한 필드는 무시함
public class ResourcesResponse {
    @JsonProperty("id")
    private String id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("type")
    private String type;

    @JsonProperty("location")
    private String location;

    @JsonProperty("tags")
    private Map<String, String> tags;

    @JsonProperty("sku")
    private Map<String, String> sku;
}
