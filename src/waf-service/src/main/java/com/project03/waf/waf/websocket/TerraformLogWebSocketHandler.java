package com.project03.waf.waf.websocket;

import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class TerraformLogWebSocketHandler extends TextWebSocketHandler {

    public static final ConcurrentHashMap<String, WebSocketSession> sessionMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = getUserId(session); // 쿼리 스트링 또는 path param에서 추출
        sessionMap.put(userId, session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = getUserId(session);
        sessionMap.remove(userId);
    }

    private String getUserId(WebSocketSession session) {
        // 예시: ws://localhost/ws/terraform-log?userId=abc
        String query = session.getUri().getQuery();
        return query.split("=")[1];
    }

    public static void sendMessage(String userId, String message) throws Exception {
        WebSocketSession session = sessionMap.get(userId);
        if (session != null && session.isOpen()) {
            session.sendMessage(new TextMessage(message));
        }
    }
}