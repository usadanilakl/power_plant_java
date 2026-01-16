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
import java.util.*;
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
            // Create broadcast socket
            broadcastSocket = new DatagramSocket();
            broadcastSocket.setBroadcast(true);

            // Create listen socket
            listenSocket = new DatagramSocket(syncConfig.getDiscoveryPort());
            listenSocket.setBroadcast(true);
            listenSocket.setSoTimeout(5000); // 5 second timeout for graceful shutdown

            running = true;
            listenerExecutor = Executors.newSingleThreadExecutor();
            listenerExecutor.submit(this::listenForPeers);

            log.info("Peer discovery initialized on port {}", syncConfig.getDiscoveryPort());

            // Announce ourselves immediately
            broadcastPresence();

        } catch (SocketException e) {
            log.error("Failed to initialize peer discovery: {}. Peer discovery will be disabled.", e.getMessage());
        }
    }

    @PreDestroy
    public void shutdown() {
        log.info("Shutting down peer discovery service...");
        running = false;

        if (broadcastSocket != null && !broadcastSocket.isClosed()) {
            broadcastSocket.close();
        }
        if (listenSocket != null && !listenSocket.isClosed()) {
            listenSocket.close();
        }
        if (listenerExecutor != null) {
            listenerExecutor.shutdownNow();
        }
    }

    /**
     * Broadcast presence to all machines on the network
     * Runs every sync interval
     */
    @Scheduled(fixedDelayString = "${sync.interval.seconds:30}000", initialDelay = 5000)
    public void broadcastPresence() {
        if (!syncConfig.isDiscoveryEnabled() || broadcastSocket == null || broadcastSocket.isClosed()) {
            return;
        }

        try {
            Map<String, Object> announcement = new HashMap<>();
            announcement.put("type", "ANNOUNCE");
            announcement.put("machineId", syncConfig.getMachineId());
            announcement.put("machineName", syncConfig.getMachineName());
            announcement.put("port", syncConfig.getSyncPort());
            announcement.put("timestamp", Instant.now().toString());

            byte[] data = objectMapper.writeValueAsBytes(announcement);

            // Broadcast to all network interfaces
            broadcastToAllInterfaces(data);

            log.debug("Broadcasted presence: {} ({})", syncConfig.getMachineName(), syncConfig.getMachineId());

        } catch (Exception e) {
            log.error("Failed to broadcast presence: {}", e.getMessage());
        }
    }

    private void broadcastToAllInterfaces(byte[] data) {
        try {
            // Try broadcast address first
            DatagramPacket packet = new DatagramPacket(
                data, data.length,
                InetAddress.getByName(BROADCAST_ADDRESS),
                syncConfig.getDiscoveryPort()
            );
            broadcastSocket.send(packet);

            // Also try subnet broadcasts for each interface
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
                        } catch (Exception e) {
                            // Ignore individual broadcast failures
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error broadcasting to interfaces: {}", e.getMessage());
        }
    }

    /**
     * Listen for peer announcements
     */
    private void listenForPeers() {
        byte[] buffer = new byte[BUFFER_SIZE];
        log.info("Started listening for peer announcements on port {}", syncConfig.getDiscoveryPort());

        while (running) {
            try {
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                listenSocket.receive(packet);

                String message = new String(packet.getData(), 0, packet.getLength());
                processAnnouncement(message, packet.getAddress().getHostAddress());

            } catch (SocketTimeoutException e) {
                // Expected - allows checking running flag
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

    @SuppressWarnings("unchecked")
    private void processAnnouncement(String message, String senderIp) {
        try {
            Map<String, Object> announcement = objectMapper.readValue(message, Map.class);

            String type = (String) announcement.get("type");
            if (!"ANNOUNCE".equals(type)) return;

            String machineId = (String) announcement.get("machineId");

            // Ignore our own broadcasts
            if (machineId.equals(syncConfig.getMachineId())) {
                return;
            }

            String machineName = (String) announcement.get("machineName");
            int port = (Integer) announcement.get("port");

            // Update or create peer
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

    /**
     * Get all active peers (seen recently)
     */
    public List<Peer> getActivePeers() {
        Instant cutoff = Instant.now().minusSeconds(syncConfig.getSyncIntervalSeconds() * 3L);
        return peerRepository.findActivePeers(cutoff, syncConfig.getMachineId());
    }

    /**
     * Get all known peers (regardless of status)
     */
    public List<Peer> getAllPeers() {
        return peerRepository.findByMachineIdNot(syncConfig.getMachineId());
    }

    /**
     * Mark a peer as offline
     */
    public void markPeerOffline(String machineId) {
        peerRepository.findById(machineId).ifPresent(peer -> {
            peer.setStatus(Peer.PeerStatus.OFFLINE);
            peerRepository.save(peer);
            log.info("Marked peer {} as offline", machineId);
        });
    }

    /**
     * Mark a peer as having an error
     */
    public void markPeerError(String machineId) {
        peerRepository.findById(machineId).ifPresent(peer -> {
            peer.setStatus(Peer.PeerStatus.ERROR);
            peerRepository.save(peer);
        });
    }

    /**
     * Update peer status to syncing
     */
    public void markPeerSyncing(String machineId) {
        peerRepository.findById(machineId).ifPresent(peer -> {
            peer.setStatus(Peer.PeerStatus.SYNCING);
            peerRepository.save(peer);
        });
    }

    /**
     * Update peer last sync time
     */
    public void updatePeerSyncTime(String machineId) {
        peerRepository.findById(machineId).ifPresent(peer -> {
            peer.setLastSyncTime(Instant.now());
            peer.setStatus(Peer.PeerStatus.ONLINE);
            peerRepository.save(peer);
        });
    }

    /**
     * Get the local IP address
     */
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

    /**
     * Cleanup stale peers
     */
    @Scheduled(fixedDelay = 300000) // Every 5 minutes
    public void cleanupStalePeers() {
        Instant cutoff = Instant.now().minusSeconds(300); // 5 minutes
        List<Peer> stalePeers = peerRepository.findStalePeers(cutoff);

        for (Peer peer : stalePeers) {
            if (peer.getStatus() != Peer.PeerStatus.OFFLINE) {
                peer.setStatus(Peer.PeerStatus.OFFLINE);
                peerRepository.save(peer);
                log.info("Marked stale peer {} as offline", peer.getMachineId());
            }
        }
    }
}
