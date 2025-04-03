package com.project03.waf.waf.service;

import com.project03.waf.waf.dto.azure.AzureAuthInfo;
import com.project03.waf.waf.dto.rule.RuleSetsUpdateDto;
import com.project03.waf.waf.dto.terraform.TerraformRequest;
import com.project03.waf.waf.dto.user.UserUpdateDto;
import com.project03.waf.waf.websocket.TerraformLogWebSocketHandler;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.*;
import java.nio.file.*;
import java.util.*;

@Service
public class TerraformService {

    private static final String SRC_PATH = "terraform/src";
    private static final String USERS_PATH = "terraform/users";

    private final UserService userService;
    private final RestTemplate restTemplate = new RestTemplate();

    public TerraformService(UserService userService) {
        this.userService = userService;
    }

    public String executeTerraform(TerraformRequest request, AzureAuthInfo authInfo) throws IOException {
        Path userDir = prepareUserDirectory(request.getUserId());
        copyMainTf(userDir);

        runTerraformCommand(userDir, List.of("terraform", "init"), request.getUserId());
        List<String> applyCommand = buildApplyCommand(request);
        String applyLog = runTerraformCommand(userDir, applyCommand, request.getUserId());

        updateRuleSet(request, authInfo);
        updateUserInfoFromLog(applyLog, request, authInfo);

        return applyLog;
    }

    public void executeTerraformAsync(TerraformRequest request, AzureAuthInfo authInfo) {
        new Thread(() -> {
            try {
                String applyLog = executeTerraform(request, authInfo);
                TerraformLogWebSocketHandler.sendMessage(request.getUserId(), "✅ Terraform 실행 완료");
            } catch (Exception e) {
                sendWebSocketError(request.getUserId(), e.getMessage());
            }
        }).start();
    }

    private Path prepareUserDirectory(String userId) throws IOException {
        Path userDir = Paths.get(USERS_PATH, userId);
        Files.createDirectories(userDir);
        return userDir;
    }

    private void copyMainTf(Path userDir) throws IOException {
        Files.copy(Paths.get(SRC_PATH, "main.tf"), userDir.resolve("main.tf"), StandardCopyOption.REPLACE_EXISTING);
    }

    private List<String> buildApplyCommand(TerraformRequest request) {
        return List.of(
                "terraform", "apply", "-lock=false", "-auto-approve",
                "-var=client_id=" + request.getClientId(),
                "-var=client_secret=" + request.getClientSecret(),
                "-var=tenant_id=" + request.getTenantId(),
                "-var=subscription_id=" + request.getSubscriptionId(),
                "-var=static_web_app_url=" + request.getStaticWebAppUrl(),
                "-var=resource_group_name=" + request.getResourceGroupName()
        );
    }

    private String runTerraformCommand(Path workingDir, List<String> command, String userId) throws IOException {
        ProcessBuilder builder = new ProcessBuilder(command);
        builder.directory(workingDir.toFile());
        builder.redirectErrorStream(true);

        Process process = builder.start();
        StringBuilder output = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                sendWebSocketLog(userId, line);
            }
        }

        return output.toString();
    }

    private void sendWebSocketLog(String userId, String message) {
        try {
            TerraformLogWebSocketHandler.sendMessage(userId, message);
        } catch (Exception e) {
            System.err.println("WebSocket send error: " + e.getMessage());
        }
    }

    private void sendWebSocketError(String userId, String errorMsg) {
        try {
            TerraformLogWebSocketHandler.sendMessage(userId, "❌ 오류 발생: " + errorMsg);
        } catch (Exception ignored) {}
    }

    private void updateRuleSet(TerraformRequest request, AzureAuthInfo authInfo) {
        String url = "http://rule-service:8083/api/rule/rule-sets";
        RuleSetsUpdateDto dto = new RuleSetsUpdateDto(request.getUserId(), request.getResourceGroupName(), "wafPolicyStaticWeb");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(authInfo.getApiKey());
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<RuleSetsUpdateDto> apiRequest = new HttpEntity<>(dto, headers);
        restTemplate.exchange(url, HttpMethod.PUT, apiRequest, String.class);
    }

    private void updateUserInfoFromLog(String log, TerraformRequest request, AzureAuthInfo authInfo) {
        Map<String, String> parsed = parseLog(log);


        System.out.println(request.getStaticWebAppUrl());

        UserUpdateDto userUpdateDto = new UserUpdateDto(
                request.getStaticWebAppUrl(),
                request.getResourceGroupName(),
                parsed.get("waf_policy_name"),
                parsed.get("log_analytics_workspace_workspace_id"),
                parsed.get("frontdoor_endpoint_host_name")
        );

        userService.updateUser(request.getUserId(), authInfo.getApiKey(), userUpdateDto);
    }

    private Map<String, String> parseLog(String log) {
        Map<String, String> result = new HashMap<>();
        String[] lines = log.split("\\r?\\n");

        for (String line : lines) {
            if (line.contains("log_analytics_workspace_workspace_id")) {
                result.put("log_analytics_workspace_workspace_id", extractValue(line));
            } else if (line.contains("waf_policy_name")) {
                result.put("waf_policy_name", extractValue(line));
            }
             else if (line.contains("frontdoor_endpoint_host_name")) {
                result.put("frontdoor_endpoint_host_name", extractValue(line));
            }
        }
        return result;
    }

    private String extractValue(String line) {
        return line.split("=")[1].trim().replace("\"", "");
    }
}
