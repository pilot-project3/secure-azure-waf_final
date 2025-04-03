package com.project03.user.user.dto;

import com.project03.user.user.entity.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private User user;

    public static UserResponse from(User user) {
        return new UserResponse(user);
    }
}
