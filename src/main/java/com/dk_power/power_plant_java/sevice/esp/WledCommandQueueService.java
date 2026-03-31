package com.dk_power.power_plant_java.sevice.esp;

import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.entities.esp.WledCommand;
import com.dk_power.power_plant_java.enums.WledCommandStatus;
import com.dk_power.power_plant_java.repository.esp.WledCommandRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WledCommandQueueService {

    private final WledCommandRepo wledCommandRepo;
    private final RestTemplate restTemplate;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public void enqueueCommand(EspDevice device, Map<String, Object> payload, Integer boxNumber) {
        WledCommand cmd = new WledCommand();
        cmd.setEspDeviceIp(device.getIpAddress());
        try {
            cmd.setPayload(objectMapper.writeValueAsString(payload));
        } catch (Exception e) {
            throw new RuntimeException("Cannot serialize WLED payload", e);
        }
        cmd.setCommandStatus(WledCommandStatus.PENDING);
        cmd.setNextRetryAt(LocalDateTime.now());
        cmd.setBoxNumber(boxNumber);
        wledCommandRepo.save(cmd);
    }

    /**
     * Process the WLED command queue.
     * Reads due commands in a short transaction, then does HTTP outside any transaction,
     * then saves results in another short transaction. No connection held during HTTP.
     */
    @Scheduled(fixedDelay = 5000)
    public void processQueue() {
        // Step 1: Read due commands (short transaction)
        List<WledCommand> dueCommands = readDueCommands();
        if (dueCommands.isEmpty()) return;

        // Step 2: Attempt HTTP for each (no transaction — no DB connection held)
        List<WledCommand> toUpdate = new ArrayList<>();
        for (WledCommand cmd : dueCommands) {
            try {
                String url = "http://" + cmd.getEspDeviceIp() + "/json/state";
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<String> request = new HttpEntity<>(cmd.getPayload(), headers);

                restTemplate.postForObject(url, request, String.class);
                cmd.setCommandStatus(WledCommandStatus.SENT);
            } catch (Exception e) {
                cmd.setRetryCount(cmd.getRetryCount() + 1);
                cmd.setLastError(e.getMessage());

                if (cmd.getRetryCount() >= cmd.getMaxRetries()) {
                    cmd.setCommandStatus(WledCommandStatus.EXPIRED);
                } else {
                    cmd.setCommandStatus(WledCommandStatus.FAILED);
                    long backoffSeconds = 5L * (1L << cmd.getRetryCount());
                    cmd.setNextRetryAt(LocalDateTime.now().plusSeconds(backoffSeconds));
                }
            }
            toUpdate.add(cmd);
        }

        // Step 3: Save results (short transaction)
        saveCommandResults(toUpdate);
    }

    @Transactional(readOnly = true)
    public List<WledCommand> readDueCommands() {
        return wledCommandRepo.findDueCommands(
                List.of(WledCommandStatus.PENDING, WledCommandStatus.FAILED),
                LocalDateTime.now()
        );
    }

    @Transactional
    public void saveCommandResults(List<WledCommand> commands) {
        wledCommandRepo.saveAll(commands);
    }

    @Transactional(readOnly = true)
    public long getPendingCount() {
        return wledCommandRepo.countByCommandStatus(WledCommandStatus.PENDING)
                + wledCommandRepo.countByCommandStatus(WledCommandStatus.FAILED);
    }

    @Transactional(readOnly = true)
    public long getExpiredCount() {
        return wledCommandRepo.countByCommandStatus(WledCommandStatus.EXPIRED);
    }

    @Transactional
    public void clearSentCommands() {
        wledCommandRepo.deleteByCommandStatus(WledCommandStatus.SENT);
    }
}
