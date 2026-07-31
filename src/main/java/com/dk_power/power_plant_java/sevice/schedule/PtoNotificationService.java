package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.dto.email.EmailRequest;
import com.dk_power.power_plant_java.dto.schedule.CoverageRequestDto;
import com.dk_power.power_plant_java.entities.schedule.CoverageRequest;
import com.dk_power.power_plant_java.entities.schedule.PtoRequest;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.sevice.email.EmailFacadeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Outbound email for schedule-v2 PTO intake: a confirmation to the requester and a "coverage needed"
 * notice to the ops distro when an approved PTO leaves shifts to fill.
 *
 * <p>Best-effort and non-fatal — a mail failure is logged, never propagated, so it can't roll back
 * the PTO/coverage the intake service just persisted. Gated by {@code schedule.pto.notify.enabled}
 * so intake can run in a dry-run (persist + materialise, no email) during validation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PtoNotificationService {

    private final EmailFacadeService emailFacade;

    @Value("${schedule.pto.notify.enabled:true}")
    private boolean notifyEnabled;
    /** Sender address; defaults to the monitored mailbox. */
    @Value("${schedule.pto.notify.from:${email.graph.from:}}")
    private String fromAddress;
    /** Ops distribution list for coverage-needed notices. Blank = don't send them. */
    @Value("${schedule.pto.notify.coverage-cc:}")
    private String coverageDistro;

    private static final DateTimeFormatter D = DateTimeFormatter.ofPattern("EEE M/d/yyyy");

    /** Confirm to the requester that their time off is recorded (and coverage requested, if any). */
    public void sendRequesterConfirmation(User user, PtoRequest pto, List<CoverageRequestDto> coverage) {
        if (!notifyEnabled) return;
        if (user == null || isBlank(user.getEmail())) return;
        String range = range(pto);
        StringBuilder body = new StringBuilder();
        body.append("Hi ").append(firstName(user)).append(",\n\n")
            .append("Your time-off request for ").append(range)
            .append(" has been recorded in the plant schedule.\n");
        if (coverage != null && !coverage.isEmpty()) {
            body.append("\nCoverage has been requested for the shift(s) you were scheduled to work:\n");
            for (CoverageRequestDto c : coverage) body.append("  • ").append(shiftLine(c)).append('\n');
            body.append("\nYou'll be covered once a coworker signs up and it's approved.\n");
        }
        body.append("\n— Plant Schedule");
        send(user.getEmail(), null, "Time off recorded: " + range, body.toString());
    }

    /** Notify the ops distro that coverage is open for an approved PTO. No-op if no distro configured. */
    public void sendCoverageNeeded(User user, PtoRequest pto, List<CoverageRequestDto> coverage) {
        if (!notifyEnabled) return;
        if (isBlank(coverageDistro) || coverage == null || coverage.isEmpty()) return;
        String who = user != null ? displayName(user) : (pto.getName() != null ? pto.getName() : "An operator");
        StringBuilder body = new StringBuilder();
        body.append(who).append(" is off ").append(range(pto)).append(". Coverage is open for:\n\n");
        for (CoverageRequestDto c : coverage) body.append("  • ").append(shiftLine(c)).append('\n');
        body.append("\nOpen the schedule to sign up or assign someone.\n\n— Plant Schedule");
        send(coverageDistro, null, "Coverage needed: " + who + " off " + range(pto), body.toString());
    }

    // ---- helpers ------------------------------------------------------------

    private void send(String to, String cc, String subject, String body) {
        try {
            emailFacade.sendEmail(EmailRequest.builder()
                    .to(to)
                    .from(isBlank(fromAddress) ? null : fromAddress)
                    .cc(cc)
                    .subject(subject)
                    .body(body)
                    .html(false)
                    .build());
        } catch (Exception e) {
            log.warn("[PtoIntake] Notification email to {} failed (non-fatal): {}", to, e.getMessage());
        }
    }

    private static String shiftLine(CoverageRequestDto c) {
        String shift = CoverageRequest.ShiftType.NIGHT.equals(c.getShift()) ? "Night" : "Day";
        String from = c.getStartDate() != null ? c.getStartDate().format(D) : "?";
        if (c.getEndDate() != null && !c.getEndDate().equals(c.getStartDate())) {
            return shift + " shift, " + from + " → " + c.getEndDate().format(D);
        }
        return shift + " shift, " + from;
    }

    private static String range(PtoRequest pto) {
        LocalDate s = pto.getStartDate(), e = pto.getEndDate();
        if (s == null && e == null) return "(dates unknown)";
        if (s != null && s.equals(e)) return s.format(D);
        return (s != null ? s.format(D) : "?") + " → " + (e != null ? e.format(D) : "?");
    }

    private static String firstName(User u) {
        if (u.getFirstName() != null && !u.getFirstName().isBlank()) return u.getFirstName();
        String n = displayName(u);
        int sp = n.indexOf(' ');
        return sp > 0 ? n.substring(0, sp) : n;
    }

    private static String displayName(User u) {
        if (u.getName() != null && !u.getName().isBlank()) return u.getName();
        String first = u.getFirstName() == null ? "" : u.getFirstName();
        String last = u.getLastName() == null ? "" : u.getLastName();
        String full = (first + " " + last).trim();
        return full.isBlank() ? ("User " + u.getId()) : full;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
