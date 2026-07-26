package com.dk_power.power_plant_java.config.security;

import com.dk_power.power_plant_java.entities.users.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Verifies the dual-issuer JWT logic: hub RS256 round-trip, Supabase HS256 acceptance, and rejection
 * of unknown issuers / tampered tokens. Keys bootstrap into a @TempDir so no real key files are touched.
 */
class JwtServiceTest {

    // 48 chars — comfortably >= 256-bit for HS256.
    private static final String SUPA_SECRET = "supabase-test-jwt-secret-0123456789-abcdefghijkl";
    private static final String SUPA_ISS = "https://abcdefgh.supabase.co/auth/v1";

    private JwtService newService(Path tempDir) {
        // Missing PEMs → JwtService bootstraps an RS256 keypair into tempDir.
        return new JwtService(
                tempDir.resolve("priv.pem").toString(),
                tempDir.resolve("pub.pem").toString(),
                "power-plant-hub",
                72,
                "",              // no supabase public key
                SUPA_SECRET,     // supabase HS256 secret
                "",
                true,            // allow key bootstrap in tests
                null);           // syncRole (null = not the hub)
    }

    private User user(String email) {
        User u = User.builder().email(email).permissionLevel("NONE").role("PWA_USER").build();
        u.setId(42L);
        return u;
    }

    @Test
    void hubTokenRoundTrips(@TempDir Path tempDir) {
        JwtService jwt = newService(tempDir);
        String token = jwt.generateToken(user("alice@plant.com"));

        Claims claims = jwt.validateToken(token);
        assertThat(claims.getSubject()).isEqualTo("alice@plant.com");
        assertThat(jwt.isHubIssued(claims)).isTrue();
        assertThat(jwt.extractEmail(claims)).isEqualTo("alice@plant.com");
    }

    @Test
    void supabaseTokenIsAccepted(@TempDir Path tempDir) {
        JwtService jwt = newService(tempDir);
        SecretKey key = Keys.hmacShaKeyFor(SUPA_SECRET.getBytes(StandardCharsets.UTF_8));
        String supaToken = Jwts.builder()
                .issuer(SUPA_ISS)
                .subject("d3adb33f-uuid")
                .claim("email", "bob@plant.com")
                .signWith(key, Jwts.SIG.HS256)
                .compact();

        Claims claims = jwt.validateToken(supaToken);
        assertThat(jwt.isHubIssued(claims)).isFalse();
        // Supabase carries email in the claim, not the subject.
        assertThat(jwt.extractEmail(claims)).isEqualTo("bob@plant.com");
    }

    @Test
    void unknownIssuerIsRejected(@TempDir Path tempDir) {
        JwtService jwt = newService(tempDir);
        SecretKey key = Keys.hmacShaKeyFor(SUPA_SECRET.getBytes(StandardCharsets.UTF_8));
        String bogus = Jwts.builder().issuer("evil-issuer").subject("x").signWith(key, Jwts.SIG.HS256).compact();

        assertThatThrownBy(() -> jwt.validateToken(bogus)).isInstanceOf(Exception.class);
    }

    @Test
    void tamperedHubTokenIsRejected(@TempDir Path tempDir) {
        JwtService jwt = newService(tempDir);
        String token = jwt.generateToken(user("carol@plant.com"));
        int lastDot = token.lastIndexOf('.');
        assertThat(lastDot).isGreaterThan(0);
        // Corrupt the FIRST signature char: its top 6 bits are always significant, so this reliably
        // changes the decoded signature bytes. (Flipping the LAST char can hit base64 padding bits that
        // decode identically, which made the earlier version flaky.)
        String sig = token.substring(lastDot + 1);
        char flipped = (sig.charAt(0) == 'A') ? 'B' : 'A';
        String tampered = token.substring(0, lastDot + 1) + flipped + sig.substring(1);

        assertThatThrownBy(() -> jwt.validateToken(tampered)).isInstanceOf(Exception.class);
    }
}
