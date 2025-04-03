package com.project03.country.country.controller;

import com.project03.country.country.dto.azure.AzureAuthInfo;
import com.project03.country.country.dto.country.CountryRequest;
import com.project03.country.country.dto.country.CountryUpdateRequest;
import com.project03.country.country.service.CountryService;
import com.project03.country.country.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class CountryController {

    private final UserService userService;
    private final CountryService countryService;

    @GetMapping("/api/country/polices")
    public ResponseEntity<String> getCountryPolicyInfo(@RequestParam String userId, String resourceGroupName, String policyName) {

        //1. Azure API Key 갱신
        userService.getAzureApiKey(userId);

        //2. Azure 권한 정보 조회
        AzureAuthInfo authInfo = userService.getAzureInfo(userId);

        CountryRequest request = new CountryRequest(userId,resourceGroupName,policyName);

        return countryService.getCountryPolicyInfo(request, authInfo);

    }

    @PutMapping("/api/country/polices")
    public ResponseEntity<String> updateCountryPolicy(@RequestBody CountryUpdateRequest request) {
        //1. Azure API Key 갱신
        userService.getAzureApiKey(request.getUserId());

        //2. Azure 권한 정보 조회
        AzureAuthInfo authInfo = userService.getAzureInfo(request.getUserId());

        //3. Policy 현재 정보 조회
        ResponseEntity<String> apiResult = countryService.getCountryPolicyInfo(new CountryRequest(request.getUserId(), request.getResourceGroupName(), request.getPolicyName()), authInfo);

        return  ResponseEntity.status(countryService.updateCountryPolicy(apiResult, request, authInfo).getStatusCode()).build();
    }
}
