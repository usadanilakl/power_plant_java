package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Fuzzy matching of names from external sources (SharePoint schedule/contact exports,
 * OnLocation contractor list) against the local User table.
 *
 * Why this exists: source data carries names like "J. Smith", "John S", "JSmith" while
 * the User table holds "John Smith". A single name string must resolve to a User row
 * (or be marked unresolved for admin triage). This is the single chokepoint for that.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserMatchService {

    private static final double CONFIDENCE_EXACT = 1.0;
    private static final double CONFIDENCE_HIGH = 0.85;
    private static final double CONFIDENCE_MEDIUM = 0.65;
    private static final double CONFIDENCE_LOW = 0.45;

    private final UserRepo userRepo;

    public static class Match {
        public final User user;
        public final double confidence;
        public Match(User user, double confidence) {
            this.user = user;
            this.confidence = confidence;
        }
    }

    /**
     * Best-effort match for a single name. Returns null when nothing crosses the
     * minimum confidence threshold ({@value #CONFIDENCE_LOW}) — caller should treat
     * null as "unresolved" and persist the raw name for triage.
     */
    public Match match(String sourceName) {
        if (sourceName == null || sourceName.isBlank()) return null;
        return match(sourceName, userRepo.findByIsActiveTrue());
    }

    /** Same as {@link #match(String)} but reusing a pre-loaded user list to avoid N queries during bulk imports. */
    public Match match(String sourceName, List<User> candidates) {
        if (sourceName == null || sourceName.isBlank() || candidates == null || candidates.isEmpty()) return null;

        String normalized = normalize(sourceName);
        User best = null;
        double bestScore = 0.0;

        for (User u : candidates) {
            double s = score(normalized, u);
            if (s > bestScore) {
                bestScore = s;
                best = u;
            }
        }
        if (best == null || bestScore < CONFIDENCE_LOW) return null;
        return new Match(best, round(bestScore));
    }

    private double score(String sourceNorm, User u) {
        double best = 0.0;
        best = Math.max(best, scoreAgainst(sourceNorm, u.getName()));
        best = Math.max(best, scoreAgainst(sourceNorm, combine(u.getFirstName(), u.getLastName())));
        best = Math.max(best, scoreAgainst(sourceNorm, combine(u.getLastName(), u.getFirstName())));
        best = Math.max(best, scoreInitialLast(sourceNorm, u));
        best = Math.max(best, scoreFirstLastNoSpace(sourceNorm, u));
        best = Math.max(best, scoreUsername(sourceNorm, u.getUsername()));
        best = Math.max(best, scoreUsername(sourceNorm, u.getWindowsUsername()));
        return best;
    }

    private double scoreAgainst(String sourceNorm, String candidate) {
        if (candidate == null || candidate.isBlank()) return 0.0;
        String c = normalize(candidate);
        if (sourceNorm.equals(c)) return CONFIDENCE_EXACT;
        if (c.contains(sourceNorm) || sourceNorm.contains(c)) return CONFIDENCE_HIGH;
        return jaroWinkler(sourceNorm, c);
    }

    private double scoreInitialLast(String sourceNorm, User u) {
        if (u.getFirstName() == null || u.getLastName() == null) return 0.0;
        String first = u.getFirstName().trim();
        String last = u.getLastName().trim();
        if (first.isEmpty() || last.isEmpty()) return 0.0;
        String initLast = (first.charAt(0) + " " + last).toLowerCase();
        String initLastDot = (first.charAt(0) + ". " + last).toLowerCase();
        if (sourceNorm.equals(initLast) || sourceNorm.equals(initLastDot)) return CONFIDENCE_HIGH;
        return 0.0;
    }

    private double scoreFirstLastNoSpace(String sourceNorm, User u) {
        if (u.getFirstName() == null || u.getLastName() == null) return 0.0;
        String squashed = (u.getFirstName() + u.getLastName()).toLowerCase().replaceAll("\\s+", "");
        if (sourceNorm.replaceAll("\\s+", "").equals(squashed)) return CONFIDENCE_HIGH;
        return 0.0;
    }

    private double scoreUsername(String sourceNorm, String username) {
        if (username == null || username.isBlank()) return 0.0;
        String u = username.toLowerCase().trim();
        String sourceSquashed = sourceNorm.replaceAll("\\s+", "");
        if (u.equals(sourceSquashed) || u.equals(sourceNorm)) return CONFIDENCE_HIGH;
        return 0.0;
    }

    private static String combine(String a, String b) {
        if (a == null && b == null) return null;
        return ((a == null ? "" : a) + " " + (b == null ? "" : b)).trim();
    }

    private static String normalize(String s) {
        return s.toLowerCase().trim().replaceAll("\\s+", " ");
    }

    private static double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    /**
     * Jaro-Winkler similarity. Tuned for short name strings where transpositions and
     * a shared prefix matter (e.g. "John Smith" vs "Jon Smith"). Returns 0..1.
     */
    private static double jaroWinkler(String s1, String s2) {
        if (s1.equals(s2)) return 1.0;
        int len1 = s1.length();
        int len2 = s2.length();
        if (len1 == 0 || len2 == 0) return 0.0;

        int matchDistance = Math.max(len1, len2) / 2 - 1;
        boolean[] s1Matches = new boolean[len1];
        boolean[] s2Matches = new boolean[len2];
        int matches = 0;
        for (int i = 0; i < len1; i++) {
            int start = Math.max(0, i - matchDistance);
            int end = Math.min(i + matchDistance + 1, len2);
            for (int j = start; j < end; j++) {
                if (s2Matches[j]) continue;
                if (s1.charAt(i) != s2.charAt(j)) continue;
                s1Matches[i] = true;
                s2Matches[j] = true;
                matches++;
                break;
            }
        }
        if (matches == 0) return 0.0;

        int transpositions = 0;
        int k = 0;
        for (int i = 0; i < len1; i++) {
            if (!s1Matches[i]) continue;
            while (!s2Matches[k]) k++;
            if (s1.charAt(i) != s2.charAt(k)) transpositions++;
            k++;
        }
        double m = matches;
        double jaro = (m / len1 + m / len2 + (m - transpositions / 2.0) / m) / 3.0;

        int prefix = 0;
        for (int i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
            if (s1.charAt(i) == s2.charAt(i)) prefix++;
            else break;
        }
        return jaro + prefix * 0.1 * (1 - jaro);
    }
}
