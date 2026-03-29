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
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class WledCommandQueueService {

    private final WledCommandRepo wledCommandRepo;
    private final RestTemplate restTemplate;
    private static final ObjectMapper objectMapper = new ObjectMapper();

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

    @Scheduled(fixedDelay = 5000)
    public void processQueue() {
        List<WledCommand> dueCommands = wledCommandRepo.findDueCommands(
                List.of(WledCommandStatus.PENDING, WledCommandStatus.FAILED),
                LocalDateTime.now()
        );

        for (WledCommand cmd : dueCommands) {
            try {
                String url = "http://" + cmd.getEspDeviceIp() + "/json/state";

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<String> request = new HttpEntity<>(cmd.getPayload(), headers);

                restTemplate.postForObject(url, request, String.class);

                cmd.setCommandStatus(WledCommandStatus.SENT);
                wledCommandRepo.save(cmd);
            } catch (Exception e) {
                cmd.setRetryCount(cmd.getRetryCount() + 1);
                cmd.setLastError(e.getMessage());

                if (cmd.getRetryCount() >= cmd.getMaxRetries()) {
                    cmd.setCommandStatus(WledCommandStatus.EXPIRED);
                } else {
                    cmd.setCommandStatus(WledCommandStatus.FAILED);
                    long backoffSeconds = 5L * (1L << cmd.getRetryCount()); // 5s, 10s, 20s, 40s, 80s
                    cmd.setNextRetryAt(LocalDateTime.now().plusSeconds(backoffSeconds));
                }
                wledCommandRepo.save(cmd);
            }
        }
    }

    public long getPendingCount() {
        return wledCommandRepo.countByCommandStatus(WledCommandStatus.PENDING)
                + wledCommandRepo.countByCommandStatus(WledCommandStatus.FAILED);
    }

    public long getExpiredCount() {
        return wledCommandRepo.countByCommandStatus(WledCommandStatus.EXPIRED);
    }

    public void clearSentCommands() {
        wledCommandRepo.deleteByCommandStatus(WledCommandStatus.SENT);
    }
}
