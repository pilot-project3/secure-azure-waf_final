package com.project03.user.user.controller;

import com.project03.user.user.dto.*;
import com.project03.user.user.entity.User;
import com.project03.user.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    @PostMapping()
    public ResponseEntity<UserResponse> join(@Valid @RequestBody JoinRequest joinRequest,
                                             HttpServletRequest request,
                                             HttpServletResponse response) {
        UserResponse userResponse = userService.join(joinRequest, request, response);
        return ResponseEntity.ok().body(userResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> signIn(@Valid @RequestBody LoginRequest loginRequest,
                                                HttpServletRequest request,
                                                HttpServletResponse response) {
        UserResponse userResponse = userService.login(loginRequest, request, response);
        return ResponseEntity.ok().body(userResponse);
    }

    @PatchMapping("/update")
    public ResponseEntity<UserResponse> updateUser(
            @RequestBody UpdateUserRequest req) {

        UserResponse updated = userService.updateUserByLoginIdAndPassword(req);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/waf-api-key")
    public ResponseEntity<ApiKeyResponse> getWafApiKey(@RequestBody @Valid ApiKeyRequest req) {
        ApiKeyResponse token = userService.getWafApiKey(req.getUserId());
        return ResponseEntity.ok(token);
    }

    @PostMapping("/log-api-key")
    public ResponseEntity<ApiKeyResponse> getLogApiKey(@RequestBody @Valid ApiKeyRequest req) {
        ApiKeyResponse token = userService.getLogApiKey(req.getUserId());
        return ResponseEntity.ok(token);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUserInfo(@PathVariable Long userId) {
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @PatchMapping("/update/{userId}")
    public ResponseEntity<UserResponse> updateUserById(
            @PathVariable Long userId,
            @RequestBody UpdateUserRequest req) {
        UserResponse updated = userService.updateUserById(req, userId);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/ai-insight/{userId}")
    public ResponseEntity<String> getAiInsight(@PathVariable Long userId) {
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(user.getAiInsight());
    }

}

