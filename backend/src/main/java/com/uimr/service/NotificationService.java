package com.uimr.service;

import com.uimr.model.Incident;
import com.uimr.model.Notification;
import com.uimr.model.User;
import com.uimr.model.enums.NotificationChannel;
import com.uimr.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final SimpMessagingTemplate messagingTemplate;
    private final RestTemplate restTemplate;

    @Value("${telegram.bot-token:}")
    private String telegramBotToken;

    @Value("${telegram.default-chat-id:}")
    private String defaultTelegramChatId;

    public void notifyIncidentCreated(Incident incident, User targetUser) {
        String title = "New Incident: " + incident.getTitle();
        String message = String.format("Severity: %s | Source: %s", incident.getSeverity(), incident.getSource());
        sendNotification(targetUser, title, message, incident, NotificationChannel.IN_APP);
    }

    public void notifyIncidentAssigned(Incident incident, User assignee) {
        String title = "Incident Assigned: " + incident.getTitle();
        String message = "You have been assigned to incident #" + incident.getId();
        sendNotification(assignee, title, message, incident, NotificationChannel.IN_APP);
    }

    public void notifyIncidentStatusChange(Incident incident, User targetUser, String oldStatus, String newStatus) {
        String title = "Incident Status Changed: " + incident.getTitle();
        String message = String.format("Status changed from %s to %s", oldStatus, newStatus);
        sendNotification(targetUser, title, message, incident, NotificationChannel.IN_APP);
    }

    public void sendNotification(User user, String title, String message, Incident incident,
                                  NotificationChannel channel) {
        // Save to DB
        Notification notification = Notification.builder()
                .user(user)
                .channel(channel)
                .title(title)
                .message(message)
                .incident(incident)
                .build();
        notificationRepo.save(notification);

        // Send via WebSocket for IN_APP
        try {
            messagingTemplate.convertAndSendToUser(
                    user.getUsername(),
                    "/queue/notifications",
                    Map.of(
                        "id", notification.getId(),
                        "title", title,
                        "message", message,
                        "incidentId", incident != null ? incident.getId() : "",
                        "createdAt", notification.getCreatedAt().toString()
                    )
            );
        } catch (Exception e) {
            log.warn("Failed to send WebSocket notification to {}: {}", user.getUsername(), e.getMessage());
        }

        // Send Telegram if configured
        if (channel == NotificationChannel.TELEGRAM || user.getTelegramChatId() != null) {
            sendTelegram(user.getTelegramChatId() != null ? user.getTelegramChatId() : defaultTelegramChatId,
                        title + "\n" + message);
        }
    }

    private void sendTelegram(String chatId, String text) {
        if (telegramBotToken.isEmpty() || chatId == null || chatId.isEmpty()) {
            log.debug("Telegram not configured, skipping notification");
            return;
        }
        try {
            String url = String.format("https://api.telegram.org/bot%s/sendMessage", telegramBotToken);
            restTemplate.postForObject(url, Map.of("chat_id", chatId, "text", text), String.class);
        } catch (Exception e) {
            log.error("Failed to send Telegram notification: {}", e.getMessage());
        }
    }

    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepo.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepo.countByUserIdAndIsReadFalse(userId);
    }

    public void markAsRead(Long notificationId) {
        notificationRepo.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepo.save(n);
        });
    }
}
