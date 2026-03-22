package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.permits.DailyPermitPackageRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PwaNotificationService {

    private final WorkRequestRepo workRequestRepo;
    private final DailyPermitPackageRepo dailyPermitPackageRepo;
    private final UserRepo userRepo;

    public Map<String, Object> getNotifications(User user) {
        LocalDateTime lastCheck = user.getLastNotificationCheck();
        if (lastCheck == null) {
            lastCheck = LocalDateTime.now().minusDays(7); // Default: last 7 days
        }

        // Find user's work requests
        List<WorkRequest> userWrs = workRequestRepo.findBySubmitterEmailIgnoreCase(user.getEmail());
        if (userWrs.isEmpty()) {
            return Map.of("unreadCount", 0, "notifications", List.of());
        }

        // Find packages that contain the user's WRs and were modified after last check
        List<Map<String, Object>> notifications = new ArrayList<>();
        LocalDateTime finalLastCheck = lastCheck;

        for (WorkRequest wr : userWrs) {
            Optional<DailyPermitPackage> pkgOpt = dailyPermitPackageRepo.findByWorkRequestId(wr.getId());
            if (pkgOpt.isEmpty()) continue;

            DailyPermitPackage pkg = pkgOpt.get();
            // Check if package was modified after last notification check
            if (pkg.getDateModified() != null && pkg.getDateModified().isAfter(finalLastCheck)) {
                Map<String, Object> notification = new LinkedHashMap<>();
                notification.put("packageId", pkg.getId());
                notification.put("packageNumber", pkg.getPermitNumber());
                notification.put("packageStatus", pkg.getPackageStatus() != null ? pkg.getPackageStatus().getName() : null);
                notification.put("workCompleted", pkg.getWorkCompleted());
                notification.put("modifiedDate", pkg.getDateModified().toString());
                notification.put("wrPermitNumber", wr.getPermitNumber());
                notifications.add(notification);
            }
        }

        return Map.of(
                "unreadCount", notifications.size(),
                "notifications", notifications
        );
    }

    public void markAsRead(User user) {
        user.setLastNotificationCheck(LocalDateTime.now());
        userRepo.save(user);
    }
}
