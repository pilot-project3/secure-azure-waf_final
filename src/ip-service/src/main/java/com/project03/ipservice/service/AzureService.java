package com.project03.ipservice.service;

import com.azure.core.credential.TokenCredential;
import com.azure.core.management.AzureEnvironment;
import com.azure.core.management.profile.AzureProfile;
import com.azure.identity.ClientSecretCredentialBuilder;
import com.azure.resourcemanager.AzureResourceManager;
import com.project03.ipservice.entity.IP;
import com.project03.ipservice.exception.AzureServiceException;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.core.ParameterizedTypeReference;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.lang.Thread;

@Service
public class AzureService {

    private static final String AZURE_API_VERSION = "2021-06-01";
    private static final String FRONTDOOR_WAF_API_URL = "https://management.azure.com/subscriptions/%s/resourceGroups/%s/providers/Microsoft.Network/frontDoorWebApplicationFirewallPolicies/%s?api-version="
            + AZURE_API_VERSION;
    private static final String LIST_WAF_API_URL = "https://management.azure.com/subscriptions/%s/resourceGroups/%s/providers/Microsoft.Network/frontDoorWebApplicationFirewallPolicies?api-version="
            + AZURE_API_VERSION;

    @Value("${azure.resource-group:default-resource-group}")
    private String resourceGroupName;

    @Value("${azure.subscription-id:}")
    private String subscriptionId;

    @Value("${azure.client-id:}")
    private String clientId;

    @Value("${azure.client-secret:}")
    private String clientSecret;

    @Value("${azure.tenant-id:}")
    private String tenantId;

    /**
     * userId를 사용하여 user-service로부터 Azure 자격증명을 받아 az cli 로그인 및
     * Azure SDK 인증을 수행합니다.
     * 
     * @param userId 사용자 식별자
     * @return 인증된 AzureResourceManager 객체
     */
    public AzureResourceManager loginAzure(Long userId) {
        try {
            // 1. user-service에서 credentials를 가져옵니다.
            RestTemplate restTemplate = new RestTemplate();
            String credentialsUrl = "http://user-service:8080/api/v1/users/" + userId;
            System.out.println("user-service 요청 URL: " + credentialsUrl);
            ResponseEntity<Map<String, Map<String, Object>>> response = restTemplate.exchange(
                    credentialsUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Map<String, Object>>>() {
                    });
            System.out.println("user-service 응답 상태: " + response.getStatusCode());
            System.out.println("user-service 응답 내용: " + response.getBody());

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new AzureServiceException("user-service로부터 자격증명을 가져오지 못했습니다: userId=" + userId);
            }
            Map<String, Map<String, Object>> responseBody = response.getBody();
            Map<String, Object> user = responseBody.get("user");
            if (user == null) {
                throw new AzureServiceException("user 정보를 찾을 수 없습니다: userId=" + userId);
            }
            String clientId = (String) user.get("clientId");
            String clientSecret = (String) user.get("clientSecret");
            String tenantId = (String) user.get("tenantId");

            System.out.println("받아온 credentials - clientId: " + clientId + ", tenantId: " + tenantId);

            // 2. az cli를 통한 서비스 프린시플 로그인을 수행하여 CLI 권한을 획득합니다.
            String loginCommand = String.format("az login --service-principal -u %s -p %s --tenant %s", clientId,
                    clientSecret, tenantId);
            ProcessBuilder pb = new ProcessBuilder();
            if (System.getProperty("os.name").toLowerCase().contains("win")) {
                pb.command("cmd.exe", "/c", loginCommand);
            } else {
                pb.command("sh", "-c", loginCommand);
            }
            pb.redirectErrorStream(true);
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new AzureServiceException("az cli 로그인 실패, exit code: " + exitCode + "\n출력: " + output.toString());
            }

            // 3. Azure SDK를 사용하여 인증된 AzureResourceManager 객체를 생성합니다.
            TokenCredential credential = new ClientSecretCredentialBuilder()
                    .clientId(clientId)
                    .clientSecret(clientSecret)
                    .tenantId(tenantId)
                    .build();
            AzureProfile profile = new AzureProfile(tenantId, subscriptionId, AzureEnvironment.AZURE);
            return AzureResourceManager.authenticate(credential, profile)
                    .withDefaultSubscription();
        } catch (Exception e) {
            throw new AzureServiceException("Azure 로그인 실패: " + e.getMessage(), e);
        }
    }

    // 추가: az cli 권한 검증을 위한 헬퍼 메소드
    private boolean verifyAzCliPermission() {
        try {
            ProcessBuilder pb = new ProcessBuilder();
            if (System.getProperty("os.name").toLowerCase().contains("win")) {
                pb.command("cmd.exe", "/c", "az account show");
            } else {
                pb.command("sh", "-c", "az account show");
            }
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();
            return (exitCode == 0);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 특정 IP 주소에 대한 WAF 규칙을 조회합니다. (Azure CLI 명령어를 사용)
     * 
     * @param clientId     Service Principal의 클라이언트 ID (사용하지 않음)
     * @param clientSecret Service Principal의 비밀 키 (사용하지 않음)
     * @param tenantId     Azure 테넌트 ID (사용하지 않음)
     * @param ipAddress    조회할 IP 주소
     * @return 해당 IP 주소에 대한 WAF 규칙 정보 맵
     */
    public Map<String, Object> getWafRuleByIp(IP ip) {
        try {
            if (!verifyAzCliPermission()) {
                // az cli 권한이 없으면 해당 자격증명을 사용하여 로그인 수행
                loginAzure(ip.getUserId());
                // 로그인 후 메소드 재실행
                return getWafRuleByIp(ip);
            }
            // user-service에서 이미 Azure CLI 로그인 상태가 유지된다고 가정하고 CLI 명령어 실행
            ProcessBuilder pbList = new ProcessBuilder(
                    "az", "network", "front-door", "waf-policy", "rule", "list",
                    "--resource-group", resourceGroupName,
                    "--policy-name", ip.getWafId(),
                    "--output", "json");
            pbList.redirectErrorStream(true);
            Process processList = pbList.start();
            int exitCodeList = processList.waitFor();
            if (exitCodeList != 0) {
                throw new AzureServiceException("WAF 정책 목록 조회 CLI 명령어 실행 실패, exit code: " + exitCodeList);
            }
            String outputList = new String(processList.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            JSONArray rulesArray = new JSONArray(outputList);
            List<Map<String, Object>> matchingRules = new ArrayList<>();

            // 각 규칙에 대해 IP 매치 여부 확인 (matchVariable: RemoteAddr로 가정)
            for (int i = 0; i < rulesArray.length(); i++) {
                JSONObject rule = rulesArray.getJSONObject(i);
                if (rule.has("matchConditions")) {
                    JSONArray matchConditions = rule.getJSONArray("matchConditions");
                    boolean isMatch = false;
                    for (int j = 0; j < matchConditions.length(); j++) {
                        JSONObject condition = matchConditions.getJSONObject(j);
                        if (condition.has("matchVariable") && "RemoteAddr".equals(condition.getString("matchVariable"))
                                && condition.has("matchValues")) {
                            JSONArray matchValues = condition.getJSONArray("matchValues");
                            for (int k = 0; k < matchValues.length(); k++) {
                                if (ip.getIpAddress().equals(matchValues.getString(k))) {
                                    isMatch = true;
                                    break;
                                }
                            }
                        }
                        if (isMatch)
                            break;
                    }
                    if (isMatch) {
                        Map<String, Object> ruleInfo = new HashMap<>();
                        ruleInfo.put("ruleId", rule.getString("name"));
                        if (rule.has("priority")) {
                            ruleInfo.put("priority", rule.getInt("priority"));
                        }
                        if (rule.has("action")) {
                            ruleInfo.put("action", rule.getString("action"));
                        }
                        matchingRules.add(ruleInfo);
                    }
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("ipAddress", ip.getIpAddress());
            result.put("matchingRules", matchingRules);
            result.put("totalMatches", matchingRules.size());
            return result;

        } catch (Exception e) {
            throw new AzureServiceException("IP 주소에 대한 WAF 규칙 조회 실패: " + e.getMessage(), e);
        }
    }

    public int getNextBlockPriority(String wafId) {
        try {
            String listCommand = String.format(
                    "az network front-door waf-policy rule list --resource-group %s --policy-name %s --output json",
                    resourceGroupName, wafId);
            ProcessBuilder pb = new ProcessBuilder();
            if (System.getProperty("os.name").toLowerCase().contains("win")) {
                pb.command("cmd.exe", "/c", listCommand);
            } else {
                pb.command("sh", "-c", listCommand);
            }
            pb.redirectErrorStream(true);
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new AzureServiceException("WAF 규칙 목록 조회 실패, exit code: " + exitCode);
            }
            String outputStr = output.toString().trim();
            JSONArray rulesArray;
            if (outputStr.startsWith("[")) {
                rulesArray = new JSONArray(outputStr);
            } else {
                rulesArray = new JSONArray("[]");
            }
            int maxPriority = 0;
            for (int i = 0; i < rulesArray.length(); i++) {
                JSONObject rule = rulesArray.getJSONObject(i);
                if (rule.has("action") && "Block".equalsIgnoreCase(rule.getString("action"))
                        && rule.has("priority")) {
                    int prio = rule.getInt("priority");
                    if (prio > maxPriority) {
                        maxPriority = prio;
                    }
                }
            }
            // 기본 block 우선순위가 없으면 100으로 설정
            return (maxPriority == 0) ? 100 : maxPriority + 1;
        } catch (Exception e) {
            throw new AzureServiceException("다음 block 우선순위 계산 실패: " + e.getMessage(), e);
        }
    }

    public int getNextPassPriority(String wafId) {
        try {
            String listCommand = String.format(
                    "az network front-door waf-policy rule list --resource-group %s --policy-name %s --output json",
                    resourceGroupName, wafId);
            ProcessBuilder pb = new ProcessBuilder();
            if (System.getProperty("os.name").toLowerCase().contains("win")) {
                pb.command("cmd.exe", "/c", listCommand);
            } else {
                pb.command("sh", "-c", listCommand);
            }
            pb.redirectErrorStream(true);
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new AzureServiceException("WAF 규칙 목록 조회 실패, exit code: " + exitCode);
            }
            String outputStr = output.toString().trim();
            JSONArray rulesArray = outputStr.startsWith("[") ? new JSONArray(outputStr) : new JSONArray("[]");
            int maxPriority = 0;
            for (int i = 0; i < rulesArray.length(); i++) {
                JSONObject rule = rulesArray.getJSONObject(i);
                if (rule.has("action") && "Allow".equalsIgnoreCase(rule.getString("action")) && rule.has("priority")) {
                    int prio = rule.getInt("priority");
                    if (prio > maxPriority) {
                        maxPriority = prio;
                    }
                }
            }
            // 기본 pass 우선순위가 없으면 1로 설정
            return (maxPriority == 0) ? 1 : maxPriority + 1;
        } catch (Exception e) {
            throw new AzureServiceException("다음 pass 우선순위 계산 실패: " + e.getMessage(), e);
        }
    }

    /**
     * 새로운 WAF 규칙을 생성합니다. (Azure CLI 명령어를 사용)
     * 
     * @param clientId     Service Principal의 클라이언트 ID (사용하지 않음, az cli는 사전 로그인 필요)
     * @param clientSecret Service Principal의 비밀 키 (사용하지 않음)
     * @param tenantId     Azure 테넌트 ID (사용하지 않음)
     * @param ip           IP 엔티티 객체
     * @return 생성된 규칙의 ID (규칙 이름에서 숫자 부분)
     */
    public void createWafRule(IP ip) {
        if (!verifyAzCliPermission()) {
            // az cli 권한이 없으면 해당 자격증명을 사용하여 로그인 수행
            loginAzure(ip.getUserId());
            // 로그인 후 메소드 재실행
            createWafRule(ip);
        } else {
            // 규칙 이름을 문자로 시작하고 하이픈 없이 생성
            String ruleName = "Rule" + System.currentTimeMillis();
            String action = "block".equalsIgnoreCase(ip.getAction()) ? "Block" : "Allow";

            // action에 따라 우선순위 설정 (block: 100, pass: 1)
            int priority;
            if ("block".equalsIgnoreCase(ip.getAction())) {
                // 캐시 갱신을 위해 잠시 대기
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                priority = getNextBlockPriority(ip.getWafId());
            } else {
                priority = getNextPassPriority(ip.getWafId());
            }

            try {
                // 1. 규칙 생성 명령어 실행 (분리된 프로세스로 실행)
                String createCommand = String.format(
                        "az network front-door waf-policy rule create " +
                                "--name %s --priority %d --rule-type MatchRule --action %s " +
                                "--resource-group %s --policy-name %s --defer",
                        ruleName, priority, action, resourceGroupName, ip.getWafId());
                ProcessBuilder pbCreate = new ProcessBuilder();
                if (System.getProperty("os.name").toLowerCase().contains("win")) {
                    pbCreate.command("cmd.exe", "/c", createCommand);
                } else {
                    pbCreate.command("sh", "-c", createCommand);
                }
                pbCreate.redirectErrorStream(true);
                Process procCreate = pbCreate.start();
                BufferedReader readerCreate = new BufferedReader(new InputStreamReader(procCreate.getInputStream()));
                StringBuilder outputCreate = new StringBuilder();
                String line;
                while ((line = readerCreate.readLine()) != null) {
                    outputCreate.append(line).append("\n");
                }
                int exitCodeCreate = procCreate.waitFor();
                if (exitCodeCreate != 0) {
                    throw new AzureServiceException(
                            "WAF 규칙 생성 실패, exit code: " + exitCodeCreate + "\n출력: " + outputCreate);
                }

                // 2. 규칙 생성 후 전파를 위해 대기
                Thread.sleep(10000);

                // 수정된 dummy match condition 로직 추가
                String matchValue;
                String negateOption;
                matchValue = ip.getIpAddress();
                negateOption = "true";

                String matchCommand = String.format(
                        "az network front-door waf-policy rule match-condition add " +
                                "--match-variable RemoteAddr --operator IPMatch --values %s --negate %s " +
                                "--name %s --resource-group %s --policy-name %s",
                        matchValue, negateOption, ruleName, resourceGroupName, ip.getWafId());
                ProcessBuilder pbMatch = new ProcessBuilder();
                if (System.getProperty("os.name").toLowerCase().contains("win")) {
                    pbMatch.command("cmd.exe", "/c", matchCommand);
                } else {
                    pbMatch.command("sh", "-c", matchCommand);
                }
                pbMatch.redirectErrorStream(true);
                Process procMatch = pbMatch.start();
                BufferedReader readerMatch = new BufferedReader(new InputStreamReader(procMatch.getInputStream()));
                StringBuilder outputMatch = new StringBuilder();
                while ((line = readerMatch.readLine()) != null) {
                    outputMatch.append(line).append("\n");
                }
                int exitCodeMatch = procMatch.waitFor();
                if (exitCodeMatch != 0) {
                    throw new AzureServiceException(
                            "WAF 규칙 match-condition 추가 실패, exit code: " + exitCodeMatch + "\n출력: " + outputMatch);
                }

            } catch (Exception e) {
                throw new AzureServiceException("WAF 규칙 생성 실패: " + e.getMessage(), e);
            }
        }
    }

    /**
     * 모든 WAF 규칙을 삭제합니다.
     */
    public void deleteAllWafRules(String wafId, String userId) {
        System.out.println("=== WAF 규칙 전체 삭제 시작 ===");
        System.out.println("WAF ID: " + wafId);
        System.out.println("User ID: " + userId);

        if (!verifyAzCliPermission()) {
            System.out.println("Azure CLI 권한이 없습니다. 로그인을 시도합니다...");
            // az cli 권한이 없으면 해당 자격증명을 사용하여 로그인 수행
            loginAzure(Long.valueOf(userId));
            // 로그인 후 메소드 재실행
            deleteAllWafRules(wafId, userId);
        } else {
            System.out.println("Azure CLI 권한이 확인되었습니다.");
            try {
                int maxRetries = 3; // 최대 재시도 횟수
                int retryCount = 0;

                while (retryCount < maxRetries) {
                    // 기존 규칙 목록 조회
                    String listCommand = String.format(
                            "az network front-door waf-policy rule list --resource-group %s --policy-name %s --output json",
                            resourceGroupName, wafId);
                    System.out.println("규칙 목록 조회 명령어: " + listCommand);

                    // OS에 맞게 실행
                    ProcessBuilder pb = new ProcessBuilder();
                    if (System.getProperty("os.name").toLowerCase().contains("win")) {
                        pb.command("cmd.exe", "/c", listCommand);
                    } else {
                        pb.command("sh", "-c", listCommand);
                    }

                    pb.redirectErrorStream(true);
                    Process process = pb.start();

                    // 실행 결과 읽기
                    BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                    StringBuilder output = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        System.out.println("목록 조회 출력: " + line);
                        output.append(line).append("\n");
                    }

                    int exitCode = process.waitFor();
                    if (exitCode != 0) {
                        throw new AzureServiceException("WAF 정책 목록 조회 실패, exit code: " + exitCode + "\n출력: " + output);
                    }

                    // 기존 규칙들 삭제
                    String outputList = output.toString().trim();
                    JSONArray rulesArray;
                    if (outputList.startsWith("[")) {
                        rulesArray = new JSONArray(outputList);
                    } else {
                        rulesArray = new JSONArray("[]");
                    }

                    if (rulesArray.length() == 0) {
                        System.out.println("삭제할 규칙이 없습니다.");
                        break;
                    }

                    System.out.println("총 " + rulesArray.length() + "개의 규칙을 삭제합니다.");

                    for (int i = 0; i < rulesArray.length(); i++) {
                        JSONObject rule = rulesArray.getJSONObject(i);
                        String ruleName = rule.getString("name");
                        String ruleAction = rule.getString("action");
                        int rulePriority = rule.getInt("priority");
                        System.out.println("\n=== 규칙 삭제 시도 ===");
                        System.out.println("규칙 정보:");
                        System.out.println("- 이름: " + ruleName);
                        System.out.println("- 액션: " + ruleAction);
                        System.out.println("- 우선순위: " + rulePriority);

                        // 5초 대기
                        System.out.println("5초 대기 중...");
                        Thread.sleep(5000);

                        // 삭제 명령어 실행
                        String deleteCommand = String.format(
                                "az network front-door waf-policy rule delete --name %s --resource-group %s --policy-name %s --defer",
                                ruleName, resourceGroupName, wafId);

                        System.out.println("실행할 삭제 명령어: " + deleteCommand);

                        pb = new ProcessBuilder();
                        if (System.getProperty("os.name").toLowerCase().contains("win")) {
                            pb.command("cmd.exe", "/c", deleteCommand);
                        } else {
                            pb.command("sh", "-c", deleteCommand);
                        }

                        pb.redirectErrorStream(true);
                        process = pb.start();

                        // 삭제 명령어 출력 읽기
                        output = new StringBuilder();
                        reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                        while ((line = reader.readLine()) != null) {
                            System.out.println("삭제 명령어 출력: " + line);
                            output.append(line).append("\n");
                        }

                        exitCode = process.waitFor();
                        if (exitCode != 0) {
                            // 충돌 에러인 경우 재시도
                            if (output.toString().contains("Conflict")) {
                                System.out.println("충돌 발생, 10초 후 재시도...");
                                Thread.sleep(10000);
                                i--; // 현재 규칙을 다시 시도하기 위해 인덱스 감소
                                continue;
                            }
                            throw new AzureServiceException("규칙 삭제 실패: " + ruleName + "\n출력: " + output);
                        }
                        System.out.println("규칙 삭제 성공: " + ruleName);
                    }

                    // 삭제 완료 후 규칙 목록 재확인
                    System.out.println("\n=== 삭제 완료 후 규칙 목록 확인 ===");
                    // 30초 대기 후 최종 확인
                    System.out.println("규칙 삭제 완료 후 30초 대기 중...");
                    Thread.sleep(30000);

                    pb = new ProcessBuilder();
                    if (System.getProperty("os.name").toLowerCase().contains("win")) {
                        pb.command("cmd.exe", "/c", listCommand);
                    } else {
                        pb.command("sh", "-c", listCommand);
                    }
                    pb.redirectErrorStream(true);
                    process = pb.start();
                    output = new StringBuilder();
                    reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                    while ((line = reader.readLine()) != null) {
                        System.out.println("최종 목록 출력: " + line);
                        output.append(line).append("\n");
                    }
                    exitCode = process.waitFor();
                    if (exitCode == 0) {
                        String finalList = output.toString().trim();
                        if (finalList.equals("[]")) {
                            System.out.println("모든 규칙이 성공적으로 삭제되었습니다.");
                            break;
                        } else {
                            System.out.println("일부 규칙이 남아있습니다. 재시도 " + (retryCount + 1) + "/" + maxRetries);
                            retryCount++;
                            if (retryCount < maxRetries) {
                                System.out.println("30초 후 재시도합니다...");
                                Thread.sleep(30000);
                            }
                        }
                    }
                }

                if (retryCount >= maxRetries) {
                    System.out.println("최대 재시도 횟수를 초과했습니다. 일부 규칙이 남아있을 수 있습니다.");
                }

                System.out.println("=== WAF 규칙 전체 삭제 완료 ===");

            } catch (Exception e) {
                System.out.println("=== WAF 규칙 전체 삭제 실패 ===");
                System.out.println("에러 메시지: " + e.getMessage());
                throw new AzureServiceException("WAF 규칙 전체 삭제 실패: " + e.getMessage(), e);
            }
        }
    }

    /**
     * WAF 규칙을 삭제합니다. (Azure CLI 명령어를 사용)
     */
    public void deleteWafRule(Long id, String userId, String wafId) {
        if (!verifyAzCliPermission()) {
            // az cli 권한이 없으면 해당 자격증명을 사용하여 로그인 수행
            loginAzure(Long.valueOf(userId));
            // 로그인 후 메소드 재실행
            deleteWafRule(id, userId, wafId);
        } else {
            try {
                String ruleName = "Rule" + id;
                String command = String.format(
                        "az network front-door waf-policy rule delete --name %s --resource-group %s --policy-name %s",
                        ruleName, resourceGroupName, wafId);

                // OS에 맞게 실행
                ProcessBuilder pb = new ProcessBuilder();
                if (System.getProperty("os.name").toLowerCase().contains("win")) {
                    pb.command("cmd.exe", "/c", command);
                } else {
                    pb.command("sh", "-c", command);
                }

                pb.redirectErrorStream(true);
                Process process = pb.start();

                // 실행 결과 읽기
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                StringBuilder output = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }

                int exitCode = process.waitFor();
                if (exitCode != 0) {
                    throw new AzureServiceException("WAF 규칙 삭제 실패, exit code: " + exitCode + "\n출력: " + output);
                }
            } catch (Exception e) {
                throw new AzureServiceException("WAF 규칙 삭제 실패: " + e.getMessage(), e);
            }
        }
    }

    public void createWafRuleByLog(IP ip, Integer priority) {
        System.out.println("=== WAF 규칙 생성 디버그 정보 ===");
        System.out.println("IP 정보:");
        System.out.println("- IP 주소: " + ip.getIpAddress());
        System.out.println("- WAF ID: " + ip.getWafId());
        System.out.println("- User ID: " + ip.getUserId());
        System.out.println("- Action: " + ip.getAction());
        System.out.println("- Priority: " + priority);

        if (!verifyAzCliPermission()) {
            System.out.println("Azure CLI 권한이 없습니다. 로그인을 시도합니다...");
            // az cli 권한이 없으면 해당 자격증명을 사용하여 로그인 수행
            loginAzure(ip.getUserId());
            // 로그인 후 메소드 재실행
            createWafRule(ip);
        } else {
            System.out.println("Azure CLI 권한이 확인되었습니다.");
            // 규칙 이름을 문자로 시작하고 하이픈 없이 생성
            String ruleName = "Rule" + System.currentTimeMillis();
            String action = "Block".equalsIgnoreCase(ip.getAction()) ? "Block" : "Allow";
            System.out.println("생성할 규칙 정보:");
            System.out.println("- Rule Name: " + ruleName);
            System.out.println("- Action: " + action);
            System.out.println("- Priority: " + priority);

            if ("Block".equalsIgnoreCase(ip.getAction())) {
                System.out.println("Block 액션 감지. 캐시 갱신을 위해 5초 대기합니다...");
                // 캐시 갱신을 위해 잠시 대기
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }

            try {
                // 1. 규칙 생성 명령어 실행 (분리된 프로세스로 실행)
                String createCommand = String.format(
                        "az network front-door waf-policy rule create " +
                                "--name %s --priority %d --rule-type MatchRule --action %s " +
                                "--resource-group %s --policy-name %s --defer",
                        ruleName, priority, action, resourceGroupName, ip.getWafId());
                System.out.println("실행할 생성 명령어:");
                System.out.println(createCommand);

                ProcessBuilder pbCreate = new ProcessBuilder();
                if (System.getProperty("os.name").toLowerCase().contains("win")) {
                    pbCreate.command("cmd.exe", "/c", createCommand);
                } else {
                    pbCreate.command("sh", "-c", createCommand);
                }
                pbCreate.redirectErrorStream(true);
                Process procCreate = pbCreate.start();
                BufferedReader readerCreate = new BufferedReader(new InputStreamReader(procCreate.getInputStream()));
                StringBuilder outputCreate = new StringBuilder();
                String line;
                while ((line = readerCreate.readLine()) != null) {
                    System.out.println("생성 명령어 출력: " + line);
                    outputCreate.append(line).append("\n");
                }
                int exitCodeCreate = procCreate.waitFor();
                if (exitCodeCreate != 0) {
                    throw new AzureServiceException(
                            "WAF 규칙 생성 실패, exit code: " + exitCodeCreate + "\n출력: " + outputCreate);
                }
                System.out.println("규칙 생성 성공. 10초 대기 후 match condition 추가...");

                // 2. 규칙 생성 후 전파를 위해 대기
                Thread.sleep(10000);

                // 수정된 dummy match condition 로직 추가
                String matchValue = ip.getIpAddress();
                String negateOption = "true";
                System.out.println("Match Condition 정보:");
                System.out.println("- Match Value: " + matchValue);
                System.out.println("- Negate Option: " + negateOption);

                String matchCommand = String.format(
                        "az network front-door waf-policy rule match-condition add " +
                                "--match-variable RemoteAddr --operator IPMatch --values %s --negate %s " +
                                "--name %s --resource-group %s --policy-name %s",
                        matchValue, negateOption, ruleName, resourceGroupName, ip.getWafId());
                System.out.println("실행할 match condition 명령어:");
                System.out.println(matchCommand);

                ProcessBuilder pbMatch = new ProcessBuilder();
                if (System.getProperty("os.name").toLowerCase().contains("win")) {
                    pbMatch.command("cmd.exe", "/c", matchCommand);
                } else {
                    pbMatch.command("sh", "-c", matchCommand);
                }
                pbMatch.redirectErrorStream(true);
                Process procMatch = pbMatch.start();
                BufferedReader readerMatch = new BufferedReader(new InputStreamReader(procMatch.getInputStream()));
                StringBuilder outputMatch = new StringBuilder();
                while ((line = readerMatch.readLine()) != null) {
                    System.out.println("Match condition 명령어 출력: " + line);
                    outputMatch.append(line).append("\n");
                }
                int exitCodeMatch = procMatch.waitFor();
                if (exitCodeMatch != 0) {
                    throw new AzureServiceException(
                            "WAF 규칙 match-condition 추가 실패, exit code: " + exitCodeMatch + "\n출력: " + outputMatch);
                }
                System.out.println("=== WAF 규칙 생성 완료 ===");

            } catch (Exception e) {
                System.out.println("=== WAF 규칙 생성 실패 ===");
                System.out.println("에러 메시지: " + e.getMessage());
                throw new AzureServiceException("WAF 규칙 생성 실패: " + e.getMessage(), e);
            }
        }
    }
}