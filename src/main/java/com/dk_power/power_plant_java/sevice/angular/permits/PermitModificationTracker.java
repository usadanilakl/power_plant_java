package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
import com.dk_power.power_plant_java.entities.permits.pojo.PackageModification;
import com.dk_power.power_plant_java.repository.permits.DailyPermitPackageRepo;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PermitModificationTracker {

    private final DailyPermitPackageRepo dailyPermitPackageRepo;

    public Optional<Long> findPackageIdForPermit(String permitType, Long permitId) {
        if (permitId == null) return Optional.empty();
        return switch (permitType) {
            case "SafeWork" -> dailyPermitPackageRepo.findPackageIdBySafeWorkId(permitId);
            case "HotWork" -> dailyPermitPackageRepo.findPackageIdByHotWorkId(permitId);
            case "ConfinedSpace" -> dailyPermitPackageRepo.findPackageIdByConfinedSpaceId(permitId);
            case "Loto" -> dailyPermitPackageRepo.findPackageIdByLotoId(permitId);
            case "EnergizedWorkPermit" -> dailyPermitPackageRepo.findPackageIdByEnergizedWorkPermitId(permitId);
            case "ExcavationPermit" -> dailyPermitPackageRepo.findPackageIdByExcavationPermitId(permitId);
            case "VentingPermit" -> dailyPermitPackageRepo.findPackageIdByVentingPermitId(permitId);
            default -> Optional.empty();
        };
    }

    public void trackPermitUpdate(String permitType, Long permitId, Object oldEntity, Object newEntity) {
        Optional<Long> packageIdOpt = findPackageIdForPermit(permitType, permitId);
        if (packageIdOpt.isEmpty()) return;

        Long packageId = packageIdOpt.get();
        DailyPermitPackage pkg = dailyPermitPackageRepo.findById(packageId).orElse(null);
        if (pkg == null) return;

        List<PackageModification> changes = detectFieldChanges(permitType, permitId, oldEntity, newEntity);
        if (changes.isEmpty()) return;

        for (PackageModification mod : changes) {
            pkg.addModification(mod);
        }
        dailyPermitPackageRepo.save(pkg);
    }

    private List<PackageModification> detectFieldChanges(String permitType, Long permitId,
                                                          Object oldEntity, Object newEntity) {
        List<PackageModification> mods = new ArrayList<>();
        String user = getCurrentUsername();
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        Class<?> clazz = oldEntity.getClass();
        while (clazz != null && !clazz.equals(Object.class)) {
            for (Field field : clazz.getDeclaredFields()) {
                if (isTrackableField(field)) {
                    field.setAccessible(true);
                    try {
                        Object oldVal = field.get(oldEntity);
                        Object newVal = field.get(newEntity);
                        String oldStr = oldVal != null ? oldVal.toString() : null;
                        String newStr = newVal != null ? newVal.toString() : null;

                        if (!Objects.equals(oldStr, newStr)) {
                            PackageModification mod = new PackageModification();
                            mod.setTimestamp(now);
                            mod.setAction("FIELD_CHANGED");
                            mod.setPermitType(permitType);
                            mod.setPermitId(permitId);
                            mod.setFieldName(field.getName());
                            mod.setOldValue(truncate(oldStr));
                            mod.setNewValue(truncate(newStr));
                            mod.setPerformedBy(user);
                            mod.setDescription(permitType + " #" + permitId + ": " + field.getName() + " changed");
                            mods.add(mod);
                        }
                    } catch (IllegalAccessException ignored) {}
                }
            }
            clazz = clazz.getSuperclass();
        }
        return mods;
    }

    private boolean isTrackableField(Field field) {
        Class<?> type = field.getType();
        return type == String.class || type == Boolean.class || type == boolean.class;
    }

    private String getCurrentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof CustomUserDetails) {
                return ((CustomUserDetails) auth.getPrincipal()).getName();
            }
        } catch (Exception ignored) {}
        return "system";
    }

    private String truncate(String value) {
        if (value == null) return null;
        return value.length() > 200 ? value.substring(0, 200) + "..." : value;
    }
}
