package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.entities.permits.PermitNumberSequence;
import com.dk_power.power_plant_java.repository.permits.PermitNumberSequenceRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Properties;

@Service
@RequiredArgsConstructor
public class PermitNumberGenerator {

    private static final Logger log = LoggerFactory.getLogger(PermitNumberGenerator.class);
    private static final String MACHINE_ID_FILE = "./machine-id.properties";
    private static volatile Integer cachedDeviceNumber = null;
    private static final Object lock = new Object();

    private final PermitNumberSequenceRepo sequenceRepo;

    @Transactional
    public String generate(String dateStr) {
        LocalDate parsedDate;
        try {
            parsedDate = LocalDate.parse(dateStr);
        } catch (Exception e) {
            parsedDate = LocalDate.now();
        }
        final LocalDate date = parsedDate;

        int deviceNumber = getDeviceNumber();

        PermitNumberSequence seq = sequenceRepo.findByDateAndDeviceNumber(date, deviceNumber)
                .orElseGet(() -> {
                    PermitNumberSequence newSeq = new PermitNumberSequence();
                    newSeq.setDate(date);
                    newSeq.setDeviceNumber(deviceNumber);
                    newSeq.setLastSequence(0);
                    return newSeq;
                });

        seq.setLastSequence(seq.getLastSequence() + 1);
        sequenceRepo.save(seq);

        String formatted = String.format("D%02d-%s-%03d",
                deviceNumber,
                date.format(DateTimeFormatter.ofPattern("yy-MM-dd")),
                seq.getLastSequence());

        log.info("Generated permit number: {}", formatted);
        return formatted;
    }

    private int getDeviceNumber() {
        if (cachedDeviceNumber != null) return cachedDeviceNumber;

        synchronized (lock) {
            if (cachedDeviceNumber != null) return cachedDeviceNumber;

            File file = new File(MACHINE_ID_FILE);
            if (file.exists()) {
                try (FileInputStream fis = new FileInputStream(file)) {
                    Properties props = new Properties();
                    props.load(fis);
                    String val = props.getProperty("device.number");
                    if (val != null && !val.isEmpty()) {
                        int num = Integer.parseInt(val);
                        if (num >= 0 && num <= 99) {
                            cachedDeviceNumber = num;
                            return num;
                        }
                    }
                } catch (Exception e) {
                    log.warn("Error reading device number: {}", e.getMessage());
                }
            }

            cachedDeviceNumber = 99;
            log.warn("Device number not configured, using fallback: {}", cachedDeviceNumber);
            return cachedDeviceNumber;
        }
    }
}
