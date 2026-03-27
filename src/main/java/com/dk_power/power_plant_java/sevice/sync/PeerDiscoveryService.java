package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SharePointSyncSettings;
import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.config.logging.LoggingContext;
import com.dk_power.power_plant_java.entities.sync.Peer;
import com.dk_power.power_plant_java.repository.sync.PeerRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.SocketTimeoutException;
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
    private final SyncEventPublisher syncEventPublisher;
    private final SharePointSyncSettings syncIntervals;

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

        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("peer.init")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            broadcastSocket = new DatagramSocket();
            broadcastSocket.setBroadcast(true);

            listenSocket = new DatagramSocket(syncConfig.getDiscoveryPort());
            listenSocket.setBroadcast(true);
            listenSocket.setSoTimeout(5000);

            running = true;
            listenerExecutor = Executors.newSingleThreadExecutor(r -> {
                Thread t = new Thread(r, "peer-discovery-listener");
                t.setDaemon(true);
                return t;
            });
            listenerExecutor.submit(this::listenForPeers);

            log.info("Peer discovery initialized on port {}", syncConfig.getDiscoveryPort());
            broadcastPresence();
        } catch (SocketException e) {
            log.error("Failed to initialize peer discovery: {}. Peer discovery will be disabled.", e.getMessage());
        }
    }

    @PreDestroy
    public void shutdown() {
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("peer.shutdown")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            log.info("Shutting down peer discovery service...");
            running = false;

            if (listenSocket != null && !listenSocket.isClosed()) {
                listenSocket.close();
            }
            if (broadcastSocket != null && !broadcastSocket.isClosed()) {
                broadcastSocket.close();
            }
            if (listenerExecutor != null) {
                listenerExecutor.shutdownNow();
                try {
                    if (!listenerExecutor.awaitTermination(2, java.util.concurrent.TimeUnit.SECONDS)) {
                        log.debug("Peer discovery executor did not terminate in time");
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            log.info("Peer discovery service shutdown complete");
        }
    }

    @Scheduled(fixedDelay = 15000, initialDelay = 5000)
    public void scheduledBroadcast() {
        if (!syncConfig.isDiscoveryEnabled() || !syncIntervals.isPeerBroadcastDue()) return;
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("peer.scheduledBroadcast")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            syncIntervals.markPeerBroadcast();
            broadcastPresence();
        }
    }

    public void broadcastPresence() {
        if (!syncConfig.isDiscoveryEnabled() || broadcastSocket == null || broadcastSocket.isClosed()) {
            return;
        }

        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("peer.broadcastPresence")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            Map<String, Object> announcement = new HashMap<>();
            announcement.put("type", "ANNOUNCE");
            announcement.put("machineId", syncConfig.getMachineId());
            announcement.put("machineName", syncConfig.getMachineName());
            announcement.put("port", syncConfig.getSyncPort());
            announcement.put("timestamp", Instant.now().toString());

            byte[] data = objectMapper.writeValueAsBytes(announcement);
            broadcastToAllInterfaces(data);
            log.debug("Broadcasted presence: {} ({})", syncConfig.getMachineName(), syncConfig.getMachineId());
        } catch (Exception e) {
            log.error("Failed to broadcast presence: {}", e.getMessage());
        }
    }

    private void broadcastToAllInterfaces(byte[] data) {
        try {
            DatagramPacket packet = new DatagramPacket(
                data, data.length,
                InetAddress.getByName(BROADCAST_ADDRESS),
                syncConfig.getDiscoveryPort()
            );
            broadcastSocket.send(packet);

            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                if (ni.isLoopback() || !ni.isUp()) continue;

                for (InterfaceAddress addr : ni.getInterfaceAddresses()) {
                    InetAddress broadcast = addr.getBroadcast();
                    if (broadcast != null) {
                        try {
                            packet = new DatagramPacket(
                                data, data.length,
                                broadcast,
                                syncConfig.getDiscoveryPort()
                            );
                            broadcastSocket.send(packet);
                        } catch (Exception ignored) {
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error broadcasting to interfaces: {}", e.getMessage());
        }
    }

    private void listenForPeers() {
        byte[] buffer = new byte[BUFFER_SIZE];
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("peer.listen")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            log.info("Started listening for peer announcements on port {}", syncConfig.getDiscoveryPort());

            while (running) {
                try {
                    DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                    listenSocket.receive(packet);

                    String message = new String(packet.getData(), 0, packet.getLength());
                    processAnnouncement(message, packet.getAddress().getHostAddress());
                } catch (SocketTimeoutException e) {
                    // expected
                } catch (SocketException e) {
                    if (running) {
                        log.error("Socket error in peer listener: {}", e.getMessage());
                    }
                } catch (Exception e) {
                    if (running) {
                        log.error("Error processing peer announcement: {}", e.getMessage());
                    }
                }
            }

            log.info("Peer listener stopped");
        }
    }

    @SuppressWarnings("unchecked")
    private void processAnnouncement(String message, String senderIp) {
        try (LoggingContext.Scope ignored = LoggingContext.openScope(Map.of(
            LoggingContext.MACHINE_ID, syncConfig.getMachineId(),
            LoggingContext.REMOTE_IP, senderIp == null ? "" : senderIp
        ))) {
            Map<String, Object> announcement = objectMapper.readValue(message, Map.class);

            String type = (String) announcement.get("type");
            if (!"ANNOUNCE".equals(type)) return;

            String machineId = (String) announcement.get("machineId");
            if (machineId.equals(syncConfig.getMachineId())) {
                return;
            }

            String machineName = (String) announcement.get("machineName");
            int port = (Integer) announcement.get("port");

            Peer peer = peerRepository.findById(machineId)
                .orElse(new Peer(machineId, machineName, senderIp, port));

            boolean isNew = peer.getLastSeen() == null;
            boolean wasOffline = !isNew && peer.getStatus() != Peer.PeerStatus.ONLINE;

            peer.setIpAddress(senderIp);
            peer.setPort(port);
            peer.setMachineName(machineName);
            peer.setLastSeen(Instant.now());
            peer.setStatus(Peer.PeerStatus.ONLINE);

            peerRepository.save(peer);

            if (isNew) {
                log.info("Discovered new peer: {} ({}) at {}:{}", machineName, machineId, senderIp, port);
                syncEventPublisher.publishPeerOnline(peer, true);
            } else if (wasOffline) {
                log.info("Peer came back online: {} ({}) at {}:{}", machineName, machineId, senderIp, port);
                syncEventPublisher.publishPeerOnline(peer, false);
            } else {
                log.debug("Updated peer: {} ({}) at {}:{}", machineName, machineId, senderIp, port);
            }
        } catch (Exception e) {
            log.warn("Failed to process announcement from {}: {}", senderIp, e.getMessage());
        }
    }

    public List<Peer> getActivePeers() {
        Instant cutoff = Instant.now().minusSeconds(syncConfig.getSyncIntervalSeconds() * 3L);
        return peerRepository.findActivePeers(cutoff, syncConfig.getMachineId());
    }

    public List<Peer> getAllPeers() {
        return peerRepository.findByMachineIdNot(syncConfig.getMachineId());
    }

    public void markPeerOffline(String machineId) {
        peerRepository.findById(machineId).ifPresent(peer -> {
            peer.setStatus(Peer.PeerStatus.OFFLINE);
            peerRepository.save(peer);
            log.info("Marked peer {} as offline", machineId);
        });
    }

    public void markPeerError(String machineId) {
        peerRepository.findById(machineId).ifPresent(peer -> {
            peer.setStatus(Peer.PeerStatus.ERROR);
            peerRepository.save(peer);
        });
    }

    public void markPeerSyncing(String machineId) {
        peerRepository.findById(machineId).ifPresent(peer -> {
            peer.setStatus(Peer.PeerStatus.SYNCING);
            peerRepository.save(peer);
        });
    }

    public void updatePeerSyncTime(String machineId) {
        peerRepository.findById(machineId).ifPresent(peer -> {
            peer.setLastSyncTime(Instant.now());
            peer.setStatus(Peer.PeerStatus.ONLINE);
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
                    if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error getting local IP: {}", e.getMessage());
        }
        return "127.0.0.1";
    }

    @Scheduled(fixedDelay = 300000)
    public void cleanupStalePeers() {
        long start = System.currentTimeMillis();
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("peer.cleanupStalePeers")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            Instant cutoff = Instant.now().minusSeconds(300);
            List<Peer> stalePeers = peerRepository.findStalePeers(cutoff);

            int markedOffline = 0;
            for (Peer peer : stalePeers) {
                if (peer.getStatus() != Peer.PeerStatus.OFFLINE) {
                    peer.setStatus(Peer.PeerStatus.OFFLINE);
                    peerRepository.save(peer);
                    markedOffline++;
                    log.info("Marked stale peer {} as offline", peer.getMachineId());
                }
            }

            log.info("peer.cleanup.complete stalePeers={} markedOffline={} durationMs={}",
                stalePeers.size(), markedOffline, System.currentTimeMillis() - start);
        }
    }
}
