package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.entities.permits.PermitNumberSequence;
import com.dk_power.power_plant_java.repository.permits.PermitNumberSequenceRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.File;
import java.io.FileInputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class PermitNumberGenerator {

    private static final Logger log = LoggerFactory.getLogger(PermitNumberGenerator.class);
    private static final String MACHINE_ID_FILE = "./machine-id.properties";
    private static volatile Integer cachedDeviceNumber = null;
    private static final Object deviceLock = new Object();

    private final PermitNumberSequenceRepo sequenceRepo;
    private final TransactionTemplate independentTx;

    /**
     * Per (date, deviceNumber) key lock. Combined with an independent transaction
     * so the sequence bump COMMITS before we release the lock — otherwise a waiter
     * would enter, re-read from the DB, and see the pre-commit value, defeating the
     * point of the sync.
     */
    private final ConcurrentMap<String, Object> keyLocks = new ConcurrentHashMap<>();

    public PermitNumberGenerator(PermitNumberSequenceRepo sequenceRepo,
                                 PlatformTransactionManager txManager) {
        this.sequenceRepo = sequenceRepo;
        this.independentTx = new TransactionTemplate(txManager);
        this.independentTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /**
     * Generate the next permit number for the given date, atomic per (date, deviceNumber).
     * NOT @Transactional at the method level — the DB work runs in an independent tx
     * inside the synchronized block so two concurrent createFromStandard callers on the
     * same JVM cannot both read the same lastSequence.
     *
     * <p>Gap semantics: the sequence tx commits independently of the caller's tx. If the
     * caller rolls back after we return, the sequence is NOT rolled back — that leaves a
     * hole (e.g. 041, 043 with 042 unused). Preferred over duplicate permit numbers.
     */
    public String generate(String dateStr) {
        LocalDate parsedDate;
        try {
            parsedDate = LocalDate.parse(dateStr);
        } catch (Exception e) {
            parsedDate = LocalDate.now();
        }
        final LocalDate date = parsedDate;
        final int deviceNumber = getDeviceNumber();

        final String key = "PN-" + date + "-" + deviceNumber;
        final Object bucketLock = keyLocks.computeIfAbsent(key, k -> new Object());

        final int nextSeq;
        synchronized (bucketLock) {
            nextSeq = independentTx.execute(status -> {
                PermitNumberSequence seq = sequenceRepo.findByDateAndDeviceNumber(date, deviceNumber)
                        .orElseGet(() -> {
                            PermitNumberSequence newSeq = new PermitNumberSequence();
                            newSeq.setDate(date);
                            newSeq.setDeviceNumber(deviceNumber);
                            newSeq.setLastSequence(0);
                            return newSeq;
                        });
                seq.setLastSequence(seq.getLastSequence() + 1);
                sequenceRepo.saveAndFlush(seq);
                return seq.getLastSequence();
            });
        }

        String formatted = String.format("D%02d-%s-%03d",
                deviceNumber,
                date.format(DateTimeFormatter.ofPattern("yy-MM-dd")),
                nextSeq);

        log.info("Generated permit number: {}", formatted);
        return formatted;
    }

    private int getDeviceNumber() {
        if (cachedDeviceNumber != null) return cachedDeviceNumber;

        synchronized (deviceLock) {
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
