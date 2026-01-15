# Field-Based Synchronization Implementation Plan

## Overview

This plan implements **field-level CRDT (Conflict-free Replicated Data Type)** synchronization for multiple Spring Boot + H2 instances running on different machines within the same network.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            LOCAL NETWORK                                     │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   DESKTOP-A     │    │   DESKTOP-B     │    │   LAPTOP-C      │         │
│  │                 │    │                 │    │                 │         │
│  │  Spring Boot    │◄──►│  Spring Boot    │◄──►│  Spring Boot    │         │
│  │  + H2 Database  │    │  + H2 Database  │    │  + H2 Database  │         │
│  │  + Angular UI   │    │  + Angular UI   │    │  + Angular UI   │         │
│  │                 │    │                 │    │                 │         │
│  │  field_change   │    │  field_change   │    │  field_change   │         │
│  │  table tracks   │    │  table tracks   │    │  table tracks   │         │
│  │  all changes    │    │  all changes    │    │  all changes    │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                     │                     │                     │
│           └─────────────────────┼─────────────────────┘                     │
│                                 │                                           │
│                    UDP Broadcast for Peer Discovery                         │
│                    REST API for Change Exchange                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Concepts

1. **Field-Level Tracking**: Instead of syncing entire entities, track individual field changes
2. **Last-Writer-Wins (LWW) per Field**: Each field resolves independently based on timestamp + machine ID
3. **Peer-to-Peer**: No central server required; machines discover and sync with each other
4. **Eventual Consistency**: All machines converge to same state given time

---

## Phase 1: Machine Identity & Configuration

### 1.1 Add Machine ID Configuration

**File: `src/main/resources/application.properties`**

Add these properties:
```properties
# Sync Configuration
sync.machine.id=${MACHINE_ID:${random.uuid}}
sync.machine.name=${COMPUTERNAME:${HOSTNAME:unknown}}
sync.port=8082
sync.discovery.port=8083
sync.discovery.enabled=true
sync.interval.seconds=30
```

### 1.2 Create SyncConfig Class

**File: `src/main/java/com/dk_power/power_plant_java/config/SyncConfig.java`**

```java
package com.dk_power.power_plant_java.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.Properties;
import java.util.UUID;

@Configuration
@Getter
@Setter
public class SyncConfig {

    @Value("${sync.machine.id:}")
    private String machineId;

    @Value("${sync.machine.name:}")
    private String machineName;

    @Value("${sync.port:8082}")
    private int syncPort;

    @Value("${sync.discovery.port:8083}")
    private int discoveryPort;

    @Value("${sync.discovery.enabled:true}")
    private boolean discoveryEnabled;

    @Value("${sync.interval.seconds:30}")
    private int syncIntervalSeconds;

    private static final String MACHINE_ID_FILE = "./machine-id.properties";

    @PostConstruct
    public void init() {
        // Ensure persistent machine ID across restarts
        if (machineId == null || machineId.isEmpty()) {
            machineId = loadOrCreateMachineId();
        }
        System.out.println("===========================================");
        System.out.println("SYNC CONFIG INITIALIZED");
        System.out.println("Machine ID: " + machineId);
        System.out.println("Machine Name: " + machineName);
        System.out.println("Sync Port: " + syncPort);
        System.out.println("Discovery Port: " + discoveryPort);
        System.out.println("===========================================");
    }

    private String loadOrCreateMachineId() {
        File file = new File(MACHINE_ID_FILE);
        Properties props = new Properties();

        if (file.exists()) {
            try (FileInputStream fis = new FileInputStream(file)) {
                props.load(fis);
                String id = props.getProperty("machine.id");
                if (id != null && !id.isEmpty()) {
                    return id;
                }
            } catch (Exception e) {
                System.err.println("Error loading machine ID: " + e.getMessage());
            }
        }

        // Generate new ID and save
        String newId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        props.setProperty("machine.id", newId);
        try (FileOutputStream fos = new FileOutputStream(file)) {
            props.store(fos, "Machine identification for sync");
        } catch (Exception e) {
            System.err.println("Error saving machine ID: " + e.getMessage());
        }

        return newId;
    }
}
```

---

## Phase 2: Field Change Tracking Entity

### 2.1 Create FieldChange Entity

**File: `src/main/java/com/dk_power/power_plant_java/entities/sync/FieldChange.java`**

```java
package com.dk_power.power_plant_java.entities.sync;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "field_change", indexes = {
    @Index(name = "idx_field_change_entity", columnList = "entityType, entityId"),
    @Index(name = "idx_field_change_timestamp", columnList = "timestamp"),
    @Index(name = "idx_field_change_machine", columnList = "originMachineId"),
    @Index(name = "idx_field_change_synced", columnList = "syncedToMachines")
})
@Getter
@Setter
@NoArgsConstructor
public class FieldChange {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Entity identification
    @Column(nullable = false)
    private String entityType;          // "Equipment", "LotoPoint", etc.

    @Column(nullable = false)
    private Long entityId;              // The entity's ID

    // Field identification
    @Column(nullable = false)
    private String fieldName;           // "name", "location", "coordinates", etc.

    // Change data
    @Column(columnDefinition = "TEXT")
    private String oldValue;            // JSON serialized previous value (nullable for creates)

    @Column(columnDefinition = "TEXT")
    private String newValue;            // JSON serialized new value

    // Tracking metadata
    @Column(nullable = false)
    private Instant timestamp;          // When change occurred (UTC)

    @Column(nullable = false)
    private String originMachineId;     // Machine that originated this change

    @Column(nullable = false)
    private String originMachineName;   // Human-readable machine name

    // Sync tracking
    @Column(columnDefinition = "TEXT")
    private String syncedToMachines;    // Comma-separated list of machine IDs that have this change

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChangeType changeType;      // CREATE, UPDATE, DELETE

    // For relationship fields
    private String relationshipType;    // "ManyToOne", "ManyToMany", "OneToMany" (null for simple fields)

    public enum ChangeType {
        CREATE,     // New entity created
        UPDATE,     // Field value changed
        DELETE      // Entity soft-deleted
    }

    // Constructor for creating a new change
    public FieldChange(String entityType, Long entityId, String fieldName,
                       String oldValue, String newValue,
                       String machineId, String machineName, ChangeType changeType) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.fieldName = fieldName;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.timestamp = Instant.now();
        this.originMachineId = machineId;
        this.originMachineName = machineName;
        this.changeType = changeType;
        this.syncedToMachines = machineId; // Initially only synced to origin
    }

    public void addSyncedMachine(String machineId) {
        if (syncedToMachines == null || syncedToMachines.isEmpty()) {
            syncedToMachines = machineId;
        } else if (!syncedToMachines.contains(machineId)) {
            syncedToMachines += "," + machineId;
        }
    }

    public boolean isSyncedTo(String machineId) {
        return syncedToMachines != null && syncedToMachines.contains(machineId);
    }
}
```

### 2.2 Create FieldChange Repository

**File: `src/main/java/com/dk_power/power_plant_java/repository/sync/FieldChangeRepository.java`**

```java
package com.dk_power.power_plant_java.repository.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FieldChangeRepository extends JpaRepository<FieldChange, UUID> {

    // Get changes not yet synced to a specific machine
    @Query("SELECT fc FROM FieldChange fc WHERE fc.syncedToMachines NOT LIKE %:machineId% ORDER BY fc.timestamp ASC")
    List<FieldChange> findChangesNotSyncedTo(@Param("machineId") String machineId);

    // Get changes since a timestamp for a specific machine
    @Query("SELECT fc FROM FieldChange fc WHERE fc.timestamp > :since AND fc.originMachineId != :machineId ORDER BY fc.timestamp ASC")
    List<FieldChange> findChangesSince(@Param("since") Instant since, @Param("machineId") String excludeMachineId);

    // Get the latest change for a specific field
    @Query("SELECT fc FROM FieldChange fc WHERE fc.entityType = :entityType AND fc.entityId = :entityId AND fc.fieldName = :fieldName ORDER BY fc.timestamp DESC LIMIT 1")
    Optional<FieldChange> findLatestChange(@Param("entityType") String entityType,
                                           @Param("entityId") Long entityId,
                                           @Param("fieldName") String fieldName);

    // Get all changes for an entity (for conflict resolution UI)
    List<FieldChange> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, Long entityId);

    // Get all changes for a specific entity type since timestamp
    List<FieldChange> findByEntityTypeAndTimestampAfterOrderByTimestampAsc(String entityType, Instant since);

    // Count pending changes to sync
    @Query("SELECT COUNT(fc) FROM FieldChange fc WHERE fc.syncedToMachines NOT LIKE %:machineId%")
    long countPendingChangesFor(@Param("machineId") String machineId);

    // Cleanup old changes (retention policy)
    @Query("DELETE FROM FieldChange fc WHERE fc.timestamp < :before")
    void deleteChangesBefore(@Param("before") Instant before);

    // Check if change already exists (for deduplication)
    boolean existsByEntityTypeAndEntityIdAndFieldNameAndTimestampAndOriginMachineId(
        String entityType, Long entityId, String fieldName, Instant timestamp, String originMachineId);
}
```

---

## Phase 3: Peer Discovery Service

### 3.1 Create Peer Entity

**File: `src/main/java/com/dk_power/power_plant_java/entities/sync/Peer.java`**

```java
package com.dk_power.power_plant_java.entities.sync;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "sync_peer")
@Getter
@Setter
@NoArgsConstructor
public class Peer {

    @Id
    private String machineId;

    private String machineName;
    private String ipAddress;
    private int port;
    private Instant lastSeen;
    private Instant lastSyncTime;

    @Enumerated(EnumType.STRING)
    private PeerStatus status;

    public enum PeerStatus {
        ONLINE,
        OFFLINE,
        SYNCING,
        ERROR
    }

    public Peer(String machineId, String machineName, String ipAddress, int port) {
        this.machineId = machineId;
        this.machineName = machineName;
        this.ipAddress = ipAddress;
        this.port = port;
        this.lastSeen = Instant.now();
        this.status = PeerStatus.ONLINE;
    }

    public String getBaseUrl() {
        return "http://" + ipAddress + ":" + port;
    }

    public boolean isStale() {
        return lastSeen.isBefore(Instant.now().minusSeconds(120)); // 2 minutes
    }
}
```

### 3.2 Create Peer Repository

**File: `src/main/java/com/dk_power/power_plant_java/repository/sync/PeerRepository.java`**

```java
package com.dk_power.power_plant_java.repository.sync;

import com.dk_power.power_plant_java.entities.sync.Peer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface PeerRepository extends JpaRepository<Peer, String> {

    List<Peer> findByStatus(Peer.PeerStatus status);

    @Query("SELECT p FROM Peer p WHERE p.lastSeen > :since AND p.machineId != :excludeId")
    List<Peer> findActivePeers(Instant since, String excludeId);

    List<Peer> findByMachineIdNot(String machineId);
}
```

### 3.3 Create Peer Discovery Service

**File: `src/main/java/com/dk_power/power_plant_java/sevice/sync/PeerDiscoveryService.java`**

```java
package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.sync.Peer;
import com.dk_power.power_plant_java.repository.sync.PeerRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.*;
import java.time.Instant;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PeerDiscoveryService {

    private final SyncConfig syncConfig;
    private final PeerRepository peerRepository;
    private final ObjectMapper objectMapper;

    private DatagramSocket broadcastSocket;
    private DatagramSocket listenSocket;
    private ExecutorService listenerExecutor;
    private volatile boolean running = false;

    private static final String BROADCAST_ADDRESS = "255.255.255.255";
    private static final int BUFFER_SIZE = 1024;

    @PostConstruct
    public void init() {
        if (!syncConfig.isDiscoveryEnabled()) {
            log.info("Peer discovery is disabled");
            return;
        }

        try {
            broadcastSocket = new DatagramSocket();
            broadcastSocket.setBroadcast(true);

            listenSocket = new DatagramSocket(syncConfig.getDiscoveryPort());
            listenSocket.setBroadcast(true);

            running = true;
            listenerExecutor = Executors.newSingleThreadExecutor();
            listenerExecutor.submit(this::listenForPeers);

            log.info("Peer discovery initialized on port {}", syncConfig.getDiscoveryPort());

            // Announce ourselves immediately
            broadcastPresence();

        } catch (Exception e) {
            log.error("Failed to initialize peer discovery: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void shutdown() {
        running = false;
        if (broadcastSocket != null) broadcastSocket.close();
        if (listenSocket != null) listenSocket.close();
        if (listenerExecutor != null) listenerExecutor.shutdownNow();
    }

    // Broadcast presence every 30 seconds
    @Scheduled(fixedDelayString = "${sync.interval.seconds:30}000")
    public void broadcastPresence() {
        if (!syncConfig.isDiscoveryEnabled() || broadcastSocket == null) return;

        try {
            Map<String, Object> announcement = new HashMap<>();
            announcement.put("type", "ANNOUNCE");
            announcement.put("machineId", syncConfig.getMachineId());
            announcement.put("machineName", syncConfig.getMachineName());
            announcement.put("port", syncConfig.getSyncPort());
            announcement.put("timestamp", Instant.now().toString());

            byte[] data = objectMapper.writeValueAsBytes(announcement);
            DatagramPacket packet = new DatagramPacket(
                data, data.length,
                InetAddress.getByName(BROADCAST_ADDRESS),
                syncConfig.getDiscoveryPort()
            );

            broadcastSocket.send(packet);
            log.debug("Broadcasted presence: {}", syncConfig.getMachineId());

        } catch (Exception e) {
            log.error("Failed to broadcast presence: {}", e.getMessage());
        }
    }

    private void listenForPeers() {
        byte[] buffer = new byte[BUFFER_SIZE];

        while (running) {
            try {
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                listenSocket.receive(packet);

                String message = new String(packet.getData(), 0, packet.getLength());
                Map<String, Object> announcement = objectMapper.readValue(message, Map.class);

                String machineId = (String) announcement.get("machineId");

                // Ignore our own broadcasts
                if (machineId.equals(syncConfig.getMachineId())) {
                    continue;
                }

                String machineName = (String) announcement.get("machineName");
                int port = (Integer) announcement.get("port");
                String ipAddress = packet.getAddress().getHostAddress();

                // Update or create peer
                Peer peer = peerRepository.findById(machineId)
                    .orElse(new Peer(machineId, machineName, ipAddress, port));

                peer.setIpAddress(ipAddress);
                peer.setPort(port);
                peer.setMachineName(machineName);
                peer.setLastSeen(Instant.now());
                peer.setStatus(Peer.PeerStatus.ONLINE);

                peerRepository.save(peer);

                log.info("Discovered peer: {} ({}) at {}:{}",
                    machineName, machineId, ipAddress, port);

            } catch (SocketException e) {
                if (running) {
                    log.error("Socket error in peer listener: {}", e.getMessage());
                }
            } catch (Exception e) {
                log.error("Error processing peer announcement: {}", e.getMessage());
            }
        }
    }

    public List<Peer> getActivePeers() {
        Instant cutoff = Instant.now().minusSeconds(syncConfig.getSyncIntervalSeconds() * 3L);
        return peerRepository.findActivePeers(cutoff, syncConfig.getMachineId());
    }

    public void markPeerOffline(String machineId) {
        peerRepository.findById(machineId).ifPresent(peer -> {
            peer.setStatus(Peer.PeerStatus.OFFLINE);
            peerRepository.save(peer);
        });
    }

    public String getLocalIpAddress() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                if (ni.isLoopback() || !ni.isUp()) continue;

                Enumeration<InetAddress> addresses = ni.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    if (addr instanceof Inet4Address) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error getting local IP: {}", e.getMessage());
        }
        return "127.0.0.1";
    }
}
```

---

## Phase 4: Field Change Tracking Service

### 4.1 Create Field Change Tracker

**File: `src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldChangeTracker.java`**

```java
package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.*;
import java.lang.reflect.Field;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class FieldChangeTracker {

    private final FieldChangeRepository fieldChangeRepository;
    private final SyncConfig syncConfig;
    private final ObjectMapper objectMapper;

    // Fields to exclude from tracking
    private static final Set<String> EXCLUDED_FIELDS = Set.of(
        "dateCreated", "dateModified", "objectType", "serialVersionUID"
    );

    // Fields that are relationships (need special handling)
    private static final Set<Class<?>> RELATIONSHIP_ANNOTATIONS = Set.of(
        ManyToOne.class, OneToMany.class, ManyToMany.class, OneToOne.class
    );

    /**
     * Track changes between old and new entity state
     */
    @Transactional
    public <T extends BaseIdEntity> List<FieldChange> trackChanges(T oldEntity, T newEntity) {
        List<FieldChange> changes = new ArrayList<>();

        if (newEntity == null) return changes;

        String entityType = newEntity.getClass().getSimpleName();
        Long entityId = newEntity.getId();

        // Handle create
        if (oldEntity == null) {
            FieldChange createChange = new FieldChange(
                entityType, entityId, "_entity_",
                null, "CREATED",
                syncConfig.getMachineId(), syncConfig.getMachineName(),
                FieldChange.ChangeType.CREATE
            );
            changes.add(createChange);

            // Track all non-null fields as initial values
            for (Field field : getAllFields(newEntity.getClass())) {
                if (shouldTrackField(field)) {
                    try {
                        field.setAccessible(true);
                        Object newValue = field.get(newEntity);
                        if (newValue != null) {
                            changes.add(createFieldChange(
                                entityType, entityId, field.getName(),
                                null, newValue,
                                FieldChange.ChangeType.CREATE,
                                getRelationshipType(field)
                            ));
                        }
                    } catch (Exception e) {
                        log.warn("Error tracking field {}: {}", field.getName(), e.getMessage());
                    }
                }
            }
        } else {
            // Handle update - compare each field
            for (Field field : getAllFields(newEntity.getClass())) {
                if (shouldTrackField(field)) {
                    try {
                        field.setAccessible(true);
                        Object oldValue = field.get(oldEntity);
                        Object newValue = field.get(newEntity);

                        if (!Objects.equals(oldValue, newValue)) {
                            changes.add(createFieldChange(
                                entityType, entityId, field.getName(),
                                oldValue, newValue,
                                FieldChange.ChangeType.UPDATE,
                                getRelationshipType(field)
                            ));
                        }
                    } catch (Exception e) {
                        log.warn("Error comparing field {}: {}", field.getName(), e.getMessage());
                    }
                }
            }
        }

        // Save all changes
        if (!changes.isEmpty()) {
            fieldChangeRepository.saveAll(changes);
            log.debug("Tracked {} changes for {} #{}", changes.size(), entityType, entityId);
        }

        return changes;
    }

    /**
     * Track entity deletion
     */
    @Transactional
    public <T extends BaseIdEntity> FieldChange trackDelete(T entity) {
        FieldChange deleteChange = new FieldChange(
            entity.getClass().getSimpleName(),
            entity.getId(),
            "_entity_",
            "EXISTED",
            "DELETED",
            syncConfig.getMachineId(),
            syncConfig.getMachineName(),
            FieldChange.ChangeType.DELETE
        );

        return fieldChangeRepository.save(deleteChange);
    }

    private FieldChange createFieldChange(String entityType, Long entityId, String fieldName,
                                          Object oldValue, Object newValue,
                                          FieldChange.ChangeType changeType,
                                          String relationshipType) {
        FieldChange change = new FieldChange(
            entityType, entityId, fieldName,
            serializeValue(oldValue),
            serializeValue(newValue),
            syncConfig.getMachineId(),
            syncConfig.getMachineName(),
            changeType
        );
        change.setRelationshipType(relationshipType);
        return change;
    }

    private String serializeValue(Object value) {
        if (value == null) return null;

        try {
            // Handle entity references - just store ID
            if (value instanceof BaseIdEntity) {
                return String.valueOf(((BaseIdEntity) value).getId());
            }

            // Handle collections of entities - store IDs
            if (value instanceof Collection) {
                Collection<?> col = (Collection<?>) value;
                if (!col.isEmpty() && col.iterator().next() instanceof BaseIdEntity) {
                    List<Long> ids = new ArrayList<>();
                    for (Object item : col) {
                        ids.add(((BaseIdEntity) item).getId());
                    }
                    return objectMapper.writeValueAsString(ids);
                }
            }

            // Handle simple values
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            log.warn("Error serializing value: {}", e.getMessage());
            return String.valueOf(value);
        }
    }

    private boolean shouldTrackField(Field field) {
        // Skip excluded fields
        if (EXCLUDED_FIELDS.contains(field.getName())) return false;

        // Skip transient fields
        if (field.isAnnotationPresent(Transient.class)) return false;

        // Skip static fields
        if (java.lang.reflect.Modifier.isStatic(field.getModifiers())) return false;

        return true;
    }

    private String getRelationshipType(Field field) {
        if (field.isAnnotationPresent(ManyToOne.class)) return "ManyToOne";
        if (field.isAnnotationPresent(OneToMany.class)) return "OneToMany";
        if (field.isAnnotationPresent(ManyToMany.class)) return "ManyToMany";
        if (field.isAnnotationPresent(OneToOne.class)) return "OneToOne";
        return null;
    }

    private List<Field> getAllFields(Class<?> clazz) {
        List<Field> fields = new ArrayList<>();
        while (clazz != null && clazz != Object.class) {
            fields.addAll(Arrays.asList(clazz.getDeclaredFields()));
            clazz = clazz.getSuperclass();
        }
        return fields;
    }
}
```

---

## Phase 5: Field Sync Service

### 5.1 Create FieldSyncService

**File: `src/main/java/com/dk_power/power_plant_java/sevice/sync/FieldSyncService.java`**

```java
package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.Peer;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.sync.PeerRepository;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class FieldSyncService {

    private final FieldChangeRepository fieldChangeRepository;
    private final PeerRepository peerRepository;
    private final PeerDiscoveryService peerDiscoveryService;
    private final ServiceFacade serviceFacade;
    private final SyncConfig syncConfig;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    /**
     * Scheduled sync with all active peers
     */
    @Scheduled(fixedDelayString = "${sync.interval.seconds:30}000", initialDelay = 10000)
    public void syncWithAllPeers() {
        List<Peer> activePeers = peerDiscoveryService.getActivePeers();

        if (activePeers.isEmpty()) {
            log.debug("No active peers found for sync");
            return;
        }

        log.info("Starting sync with {} active peers", activePeers.size());

        for (Peer peer : activePeers) {
            try {
                syncWithPeer(peer);
            } catch (Exception e) {
                log.error("Failed to sync with peer {}: {}", peer.getMachineId(), e.getMessage());
                peerDiscoveryService.markPeerOffline(peer.getMachineId());
            }
        }
    }

    /**
     * Sync with a specific peer
     */
    @Transactional
    public void syncWithPeer(Peer peer) {
        log.info("Syncing with peer: {} ({})", peer.getMachineName(), peer.getMachineId());

        peer.setStatus(Peer.PeerStatus.SYNCING);
        peerRepository.save(peer);

        try {
            // 1. Get changes we need to send to this peer
            List<FieldChange> outgoingChanges = fieldChangeRepository
                .findChangesNotSyncedTo(peer.getMachineId());

            // 2. Send our changes and receive their changes
            List<FieldChange> incomingChanges = exchangeChanges(peer, outgoingChanges);

            // 3. Apply incoming changes with conflict resolution
            if (incomingChanges != null && !incomingChanges.isEmpty()) {
                applyIncomingChanges(incomingChanges);
            }

            // 4. Mark our changes as synced to this peer
            for (FieldChange change : outgoingChanges) {
                change.addSyncedMachine(peer.getMachineId());
            }
            fieldChangeRepository.saveAll(outgoingChanges);

            // Update peer status
            peer.setStatus(Peer.PeerStatus.ONLINE);
            peer.setLastSyncTime(Instant.now());
            peerRepository.save(peer);

            log.info("Sync complete with {}: sent {} changes, received {} changes",
                peer.getMachineName(), outgoingChanges.size(),
                incomingChanges != null ? incomingChanges.size() : 0);

        } catch (Exception e) {
            peer.setStatus(Peer.PeerStatus.ERROR);
            peerRepository.save(peer);
            throw e;
        }
    }

    /**
     * Exchange changes with a peer via REST API
     */
    private List<FieldChange> exchangeChanges(Peer peer, List<FieldChange> outgoingChanges) {
        String url = peer.getBaseUrl() + "/api/field-sync/exchange";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Machine-Name", syncConfig.getMachineName());

        Map<String, Object> request = new HashMap<>();
        request.put("machineId", syncConfig.getMachineId());
        request.put("changes", outgoingChanges);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<List<FieldChange>> response = restTemplate.exchange(
                url, HttpMethod.POST, entity,
                new ParameterizedTypeReference<List<FieldChange>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error exchanging changes with {}: {}", peer.getMachineId(), e.getMessage());
            throw new RuntimeException("Sync exchange failed", e);
        }
    }

    /**
     * Apply incoming changes with Last-Writer-Wins per field
     */
    @Transactional
    public void applyIncomingChanges(List<FieldChange> incomingChanges) {
        // Group changes by entity
        Map<String, Map<Long, List<FieldChange>>> changesByEntity = new HashMap<>();

        for (FieldChange change : incomingChanges) {
            changesByEntity
                .computeIfAbsent(change.getEntityType(), k -> new HashMap<>())
                .computeIfAbsent(change.getEntityId(), k -> new ArrayList<>())
                .add(change);
        }

        // Process each entity's changes
        for (Map.Entry<String, Map<Long, List<FieldChange>>> entityEntry : changesByEntity.entrySet()) {
            String entityType = entityEntry.getKey();

            for (Map.Entry<Long, List<FieldChange>> idEntry : entityEntry.getValue().entrySet()) {
                Long entityId = idEntry.getKey();
                List<FieldChange> changes = idEntry.getValue();

                applyEntityChanges(entityType, entityId, changes);
            }
        }
    }

    /**
     * Apply changes to a single entity using LWW per field
     */
    @SuppressWarnings("unchecked")
    private void applyEntityChanges(String entityType, Long entityId, List<FieldChange> changes) {
        try {
            var service = serviceFacade.getService(entityType);
            if (service == null) {
                log.warn("No service found for entity type: {}", entityType);
                return;
            }

            // Get current entity
            BaseIdEntity entity = (BaseIdEntity) service.getEntity(entityId);

            // Handle entity creation
            if (entity == null) {
                // Check if this is a CREATE change
                boolean hasCreate = changes.stream()
                    .anyMatch(c -> c.getChangeType() == FieldChange.ChangeType.CREATE
                              && "_entity_".equals(c.getFieldName()));

                if (!hasCreate) {
                    log.warn("Entity {}#{} not found and no CREATE change present", entityType, entityId);
                    return;
                }

                // Create new entity - service will handle this
                entity = createEntityFromChanges(entityType, entityId, changes);
                if (entity != null) {
                    service.getRepo().save(entity);
                }
                return;
            }

            // Apply field changes using LWW
            boolean modified = false;
            for (FieldChange change : changes) {
                if ("_entity_".equals(change.getFieldName())) {
                    if (change.getChangeType() == FieldChange.ChangeType.DELETE) {
                        entity.setDeleted(true);
                        modified = true;
                    }
                    continue;
                }

                // Check if we should apply this change (LWW)
                Optional<FieldChange> localChange = fieldChangeRepository.findLatestChange(
                    entityType, entityId, change.getFieldName());

                boolean shouldApply = localChange.isEmpty() ||
                    change.getTimestamp().isAfter(localChange.get().getTimestamp()) ||
                    (change.getTimestamp().equals(localChange.get().getTimestamp()) &&
                     change.getOriginMachineId().compareTo(localChange.get().getOriginMachineId()) > 0);

                if (shouldApply) {
                    applyFieldChange(entity, change);
                    modified = true;

                    // Save the incoming change to our log (mark as synced to us)
                    if (!fieldChangeRepository.existsByEntityTypeAndEntityIdAndFieldNameAndTimestampAndOriginMachineId(
                        change.getEntityType(), change.getEntityId(), change.getFieldName(),
                        change.getTimestamp(), change.getOriginMachineId())) {

                        change.addSyncedMachine(syncConfig.getMachineId());
                        fieldChangeRepository.save(change);
                    }
                } else {
                    log.debug("Skipping change for {}.{} - local change is newer",
                        entityType, change.getFieldName());
                }
            }

            if (modified) {
                service.getRepo().save(entity);
                log.debug("Applied changes to {}#{}", entityType, entityId);
            }

        } catch (Exception e) {
            log.error("Error applying changes to {}#{}: {}", entityType, entityId, e.getMessage());
        }
    }

    /**
     * Apply a single field change to an entity
     */
    private void applyFieldChange(BaseIdEntity entity, FieldChange change) {
        try {
            Field field = findField(entity.getClass(), change.getFieldName());
            if (field == null) {
                log.warn("Field not found: {}.{}", entity.getClass().getSimpleName(), change.getFieldName());
                return;
            }

            field.setAccessible(true);
            Object value = deserializeValue(change.getNewValue(), field.getType(), change.getRelationshipType());
            field.set(entity, value);

        } catch (Exception e) {
            log.error("Error applying field change {}: {}", change.getFieldName(), e.getMessage());
        }
    }

    /**
     * Deserialize a value from JSON string
     */
    private Object deserializeValue(String json, Class<?> targetType, String relationshipType) {
        if (json == null) return null;

        try {
            // Handle relationship references
            if (relationshipType != null && BaseIdEntity.class.isAssignableFrom(targetType)) {
                Long id = Long.parseLong(json.replace("\"", ""));
                // Would need to fetch the entity - for now just return null
                // In full implementation, use ServiceFacade to load the referenced entity
                return null; // TODO: Load referenced entity
            }

            return objectMapper.readValue(json, targetType);
        } catch (Exception e) {
            log.warn("Error deserializing value: {}", e.getMessage());
            return null;
        }
    }

    private Field findField(Class<?> clazz, String fieldName) {
        while (clazz != null && clazz != Object.class) {
            try {
                return clazz.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                clazz = clazz.getSuperclass();
            }
        }
        return null;
    }

    private BaseIdEntity createEntityFromChanges(String entityType, Long entityId, List<FieldChange> changes) {
        // This would create a new entity instance and apply all field values
        // Implementation depends on your entity factory pattern
        log.info("Would create new {}#{} from {} changes", entityType, entityId, changes.size());
        return null; // TODO: Implement entity creation
    }

    /**
     * Get pending changes for a specific peer
     */
    public List<FieldChange> getPendingChangesFor(String machineId) {
        return fieldChangeRepository.findChangesNotSyncedTo(machineId);
    }

    /**
     * Receive and process changes from a peer, return our pending changes
     */
    @Transactional
    public List<FieldChange> receiveChangesAndRespond(String fromMachineId, List<FieldChange> incomingChanges) {
        // Apply incoming changes
        if (incomingChanges != null && !incomingChanges.isEmpty()) {
            log.info("Received {} changes from {}", incomingChanges.size(), fromMachineId);
            applyIncomingChanges(incomingChanges);

            // Mark as synced from that machine
            for (FieldChange change : incomingChanges) {
                change.addSyncedMachine(syncConfig.getMachineId());
            }
            fieldChangeRepository.saveAll(incomingChanges);
        }

        // Return our pending changes for that peer
        return getPendingChangesFor(fromMachineId);
    }
}
```

---

## Phase 6: REST Controller for Sync

### 6.1 Create FieldSyncController

**File: `src/main/java/com/dk_power/power_plant_java/controller/sync/FieldSyncController.java`**

```java
package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.Peer;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.sync.FieldSyncService;
import com.dk_power.power_plant_java.sevice.sync.PeerDiscoveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/field-sync")
@RequiredArgsConstructor
@Slf4j
public class FieldSyncController {

    private final FieldSyncService fieldSyncService;
    private final PeerDiscoveryService peerDiscoveryService;
    private final FieldChangeRepository fieldChangeRepository;
    private final SyncConfig syncConfig;

    /**
     * Exchange changes with a peer
     * POST /api/field-sync/exchange
     */
    @PostMapping("/exchange")
    public ResponseEntity<List<FieldChange>> exchangeChanges(
            @RequestHeader("X-Machine-Id") String fromMachineId,
            @RequestHeader("X-Machine-Name") String fromMachineName,
            @RequestBody Map<String, Object> request) {

        log.info("Received sync request from {} ({})", fromMachineName, fromMachineId);

        @SuppressWarnings("unchecked")
        List<FieldChange> incomingChanges = (List<FieldChange>) request.get("changes");

        List<FieldChange> ourChanges = fieldSyncService.receiveChangesAndRespond(
            fromMachineId, incomingChanges);

        return ResponseEntity.ok(ourChanges);
    }

    /**
     * Get changes since a timestamp
     * GET /api/field-sync/changes?since=2024-01-01T00:00:00Z
     */
    @GetMapping("/changes")
    public ResponseEntity<List<FieldChange>> getChanges(
            @RequestParam Instant since,
            @RequestHeader(value = "X-Machine-Id", required = false) String excludeMachineId) {

        List<FieldChange> changes = fieldChangeRepository.findChangesSince(
            since, excludeMachineId != null ? excludeMachineId : "");

        return ResponseEntity.ok(changes);
    }

    /**
     * Get sync status and peer information
     * GET /api/field-sync/status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();

        status.put("machineId", syncConfig.getMachineId());
        status.put("machineName", syncConfig.getMachineName());
        status.put("localIp", peerDiscoveryService.getLocalIpAddress());
        status.put("syncPort", syncConfig.getSyncPort());
        status.put("discoveryPort", syncConfig.getDiscoveryPort());

        List<Peer> peers = peerDiscoveryService.getActivePeers();
        status.put("activePeers", peers);
        status.put("peerCount", peers.size());

        long pendingChanges = fieldChangeRepository.count();
        status.put("totalChangesTracked", pendingChanges);

        return ResponseEntity.ok(status);
    }

    /**
     * Manually trigger sync with all peers
     * POST /api/field-sync/trigger
     */
    @PostMapping("/trigger")
    public ResponseEntity<Map<String, Object>> triggerSync() {
        Map<String, Object> result = new HashMap<>();

        try {
            fieldSyncService.syncWithAllPeers();
            result.put("success", true);
            result.put("message", "Sync triggered successfully");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Sync failed: " + e.getMessage());
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Get list of discovered peers
     * GET /api/field-sync/peers
     */
    @GetMapping("/peers")
    public ResponseEntity<List<Peer>> getPeers() {
        return ResponseEntity.ok(peerDiscoveryService.getActivePeers());
    }

    /**
     * Get changes for a specific entity
     * GET /api/field-sync/changes/{entityType}/{entityId}
     */
    @GetMapping("/changes/{entityType}/{entityId}")
    public ResponseEntity<List<FieldChange>> getEntityChanges(
            @PathVariable String entityType,
            @PathVariable Long entityId) {

        List<FieldChange> changes = fieldChangeRepository
            .findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);

        return ResponseEntity.ok(changes);
    }
}
```

---

## Phase 7: Integration with Existing Services

### 7.1 Create Sync-Aware Base Service

**File: `src/main/java/com/dk_power/power_plant_java/sevice/base_services/SyncAwareCrudService.java`**

```java
package com.dk_power.power_plant_java.sevice.base_services;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.sevice.sync.FieldChangeTracker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

/**
 * Mixin interface for services that need field-level change tracking
 */
public interface SyncAwareCrudService<E extends BaseIdEntity> {

    FieldChangeTracker getFieldChangeTracker();

    /**
     * Save with change tracking
     */
    @Transactional
    default E saveWithTracking(E oldState, E newState) {
        getFieldChangeTracker().trackChanges(oldState, newState);
        return newState; // Actual save is done by caller
    }

    /**
     * Delete with change tracking
     */
    @Transactional
    default void deleteWithTracking(E entity) {
        getFieldChangeTracker().trackDelete(entity);
    }
}
```

### 7.2 Example: Modify EquipmentService

Add to your existing equipment service (conceptual - adapt to your actual structure):

```java
// In EquipmentServiceImpl or similar

@Autowired
private FieldChangeTracker fieldChangeTracker;

@Override
@Transactional
public Equipment save(Equipment equipment) {
    Equipment oldState = null;
    if (equipment.getId() != null) {
        oldState = repository.findById(equipment.getId()).orElse(null);
        if (oldState != null) {
            // Detach to preserve old state for comparison
            entityManager.detach(oldState);
        }
    }

    Equipment saved = repository.save(equipment);

    // Track the changes
    fieldChangeTracker.trackChanges(oldState, saved);

    return saved;
}

@Override
@Transactional
public void delete(Long id) {
    Equipment entity = repository.findById(id).orElse(null);
    if (entity != null) {
        fieldChangeTracker.trackDelete(entity);
        entity.setDeleted(true);
        repository.save(entity);
    }
}
```

---

## Phase 8: Configuration & Dependencies

### 8.1 Add Maven Dependencies (if needed)

```xml
<!-- Add to pom.xml if not present -->

<!-- For scheduling -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-scheduling</artifactId>
</dependency>
```

### 8.2 Enable Scheduling

**File: `src/main/java/com/dk_power/power_plant_java/PowerPlantJavaApplication.java`**

Add `@EnableScheduling`:

```java
@SpringBootApplication
@EnableScheduling  // Add this
public class PowerPlantJavaApplication {
    public static void main(String[] args) {
        SpringApplication.run(PowerPlantJavaApplication.class, args);
    }
}
```

### 8.3 Application Properties

**File: `src/main/resources/application.properties`**

Add:
```properties
# Field-Based Sync Configuration
sync.machine.id=
sync.machine.name=${COMPUTERNAME:${HOSTNAME:Machine}}
sync.port=8082
sync.discovery.port=8083
sync.discovery.enabled=true
sync.interval.seconds=30

# Change retention (days)
sync.retention.days=30
```

---

## Phase 9: Frontend Integration (Optional)

### 9.1 Angular Sync Status Component

**File: `frontend/src/app/services/sync-status.service.ts`**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SyncStatus {
  machineId: string;
  machineName: string;
  localIp: string;
  syncPort: number;
  activePeers: Peer[];
  peerCount: number;
  totalChangesTracked: number;
}

export interface Peer {
  machineId: string;
  machineName: string;
  ipAddress: string;
  port: number;
  lastSeen: string;
  status: 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'ERROR';
}

@Injectable({ providedIn: 'root' })
export class SyncStatusService {
  private apiUrl = `${environment.apiUrl}/field-sync`;
  private statusSubject = new BehaviorSubject<SyncStatus | null>(null);

  status$ = this.statusSubject.asObservable();

  constructor(private http: HttpClient) {
    // Poll status every 10 seconds
    interval(10000).pipe(
      switchMap(() => this.fetchStatus())
    ).subscribe();

    // Initial fetch
    this.fetchStatus().subscribe();
  }

  fetchStatus(): Observable<SyncStatus> {
    return this.http.get<SyncStatus>(`${this.apiUrl}/status`).pipe(
      tap(status => this.statusSubject.next(status))
    );
  }

  triggerSync(): Observable<any> {
    return this.http.post(`${this.apiUrl}/trigger`, {});
  }

  getPeers(): Observable<Peer[]> {
    return this.http.get<Peer[]>(`${this.apiUrl}/peers`);
  }

  getEntityChanges(entityType: string, entityId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/changes/${entityType}/${entityId}`);
  }
}
```

---

## Implementation Order

### Week 1: Foundation
1. [ ] Create `SyncConfig` class
2. [ ] Create `FieldChange` entity and repository
3. [ ] Create `Peer` entity and repository
4. [ ] Test database schema creation

### Week 2: Core Services
5. [ ] Implement `PeerDiscoveryService`
6. [ ] Implement `FieldChangeTracker`
7. [ ] Test peer discovery on local network

### Week 3: Sync Logic
8. [ ] Implement `FieldSyncService`
9. [ ] Implement `FieldSyncController`
10. [ ] Test basic sync between two machines

### Week 4: Integration
11. [ ] Integrate change tracking into existing services (Equipment, LotoPoint, etc.)
12. [ ] Add frontend sync status component
13. [ ] End-to-end testing

### Week 5: Polish
14. [ ] Add conflict resolution UI (optional)
15. [ ] Add sync history/audit log viewer
16. [ ] Performance optimization
17. [ ] Documentation

---

## Testing Checklist

- [ ] Two machines on same network discover each other
- [ ] Changes on Machine A appear on Machine B within sync interval
- [ ] Changes on Machine B appear on Machine A within sync interval
- [ ] Concurrent changes to different fields merge correctly
- [ ] Concurrent changes to same field resolve via LWW
- [ ] Machine going offline doesn't break sync for others
- [ ] Machine coming back online syncs missed changes
- [ ] Large batch of changes syncs efficiently

---

## Limitations & Future Improvements

### Current Limitations
1. **Network-only**: Requires LAN connectivity
2. **LWW conflicts**: Same-field concurrent edits may lose data
3. **No offline queue**: Changes while network is down may be lost
4. **Relationship handling**: Complex relationships need careful handling

### Future Improvements
1. **Vector clocks**: For better conflict detection
2. **Merge strategies**: Custom merge logic per field type
3. **Offline queue**: Persist changes when peers unavailable
4. **Compression**: Compress large change batches
5. **Selective sync**: Sync only specific entity types
6. **WebSocket**: Real-time push instead of polling
