package com.dk_power.power_plant_java.config.security;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.List;

/**
 * Loads / bootstraps the PEM key material the {@link JwtService} needs.
 *
 * <p>Keys are expected in the standard OpenSSL PEM encodings:
 * <ul>
 *   <li>Private: PKCS#8 — {@code -----BEGIN PRIVATE KEY-----}</li>
 *   <li>Public: X.509 SubjectPublicKeyInfo — {@code -----BEGIN PUBLIC KEY-----}</li>
 * </ul>
 * A PKCS#1 private key ({@code BEGIN RSA PRIVATE KEY}) is rejected with a clear
 * message telling the operator to convert it, because the JDK can't parse PKCS#1
 * without BouncyCastle (which this project doesn't ship).
 */
@Slf4j
public final class JwtKeyLoader {

    private JwtKeyLoader() {}

    /** Public-key algorithms we try, in order, when the PEM doesn't say which it is. */
    private static final List<String> PUBLIC_KEY_ALGORITHMS = List.of("RSA", "EC", "EdDSA", "Ed25519");

    // ── Private key ─────────────────────────────────────────────────────────

    public static PrivateKey loadPrivateKey(Path path) {
        try {
            String pem = Files.readString(path, StandardCharsets.UTF_8);
            if (pem.contains("BEGIN RSA PRIVATE KEY")) {
                throw new IllegalStateException(
                        "Private key at " + path + " is PKCS#1. Convert it to PKCS#8 with:\n"
                        + "  openssl pkcs8 -topk8 -nocrypt -in " + path + " -out " + path + ".pk8");
            }
            byte[] der = decodePem(pem);
            return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load JWT private key from " + path + ": " + e.getMessage(), e);
        }
    }

    // ── Public key ──────────────────────────────────────────────────────────

    public static PublicKey loadPublicKey(Path path) {
        try {
            return loadPublicKey(Files.readString(path, StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read JWT public key from " + path + ": " + e.getMessage(), e);
        }
    }

    public static PublicKey loadPublicKey(String pem) {
        byte[] der = decodePem(pem);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(der);
        RuntimeException last = null;
        for (String alg : PUBLIC_KEY_ALGORITHMS) {
            try {
                return KeyFactory.getInstance(alg).generatePublic(spec);
            } catch (Exception e) {
                last = new IllegalStateException(e);
            }
        }
        throw new IllegalStateException("Unsupported public key format (tried " + PUBLIC_KEY_ALGORITHMS + ")", last);
    }

    /** RSA public key derived from an RSA private key (used when only the private PEM is present). */
    public static PublicKey derivePublicKey(PrivateKey privateKey) {
        try {
            if (privateKey instanceof RSAPrivateCrtKey crt) {
                RSAPublicKeySpec spec = new RSAPublicKeySpec(crt.getModulus(), crt.getPublicExponent());
                return KeyFactory.getInstance("RSA").generatePublic(spec);
            }
            throw new IllegalStateException("Cannot derive a public key from a non-RSA private key");
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to derive public key: " + e.getMessage(), e);
        }
    }

    // ── Bootstrap (dev convenience) ─────────────────────────────────────────

    /**
     * Generates a fresh RSA-2048 keypair and writes {@code privatePath} (PKCS#8) and
     * {@code publicPath} (X.509) as PEM. Parent directories are created as needed.
     */
    public static KeyPair generateAndWrite(Path privatePath, Path publicPath) {
        try {
            KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
            gen.initialize(2048);
            KeyPair pair = gen.generateKeyPair();
            writePem(privatePath, "PRIVATE KEY", pair.getPrivate().getEncoded());
            writePem(publicPath, "PUBLIC KEY", pair.getPublic().getEncoded());
            return pair;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate JWT keypair: " + e.getMessage(), e);
        }
    }

    public static void writePem(Path path, String type, byte[] der) {
        try {
            if (path.getParent() != null) {
                Files.createDirectories(path.getParent());
            }
            String base64 = Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(der);
            String pem = "-----BEGIN " + type + "-----\n" + base64 + "\n-----END " + type + "-----\n";
            Files.writeString(path, pem, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to write PEM to " + path + ": " + e.getMessage(), e);
        }
    }

    // ── Internals ───────────────────────────────────────────────────────────

    private static byte[] decodePem(String pem) {
        String body = pem
                .replaceAll("-----BEGIN [^-]+-----", "")
                .replaceAll("-----END [^-]+-----", "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(body);
    }
}
