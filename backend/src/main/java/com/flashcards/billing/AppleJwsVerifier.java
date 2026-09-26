package com.flashcards.billing;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.Signature;
import java.security.cert.CertPath;
import java.security.cert.CertPathValidator;
import java.security.cert.CertificateFactory;
import java.security.cert.PKIXParameters;
import java.security.cert.TrustAnchor;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

class AppleJwsVerifier {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String ROOT_RESOURCE = "/apple/AppleRootCA-G3.cer";

    private final X509Certificate appleRoot;

    AppleJwsVerifier() {
        this.appleRoot = loadAppleRoot();
    }

    DecodedTransaction verify(String compactJws) {
        if (compactJws == null || compactJws.isBlank()) {
            throw new IllegalArgumentException("Missing transaction");
        }
        String[] parts = compactJws.trim().split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid transaction");
        }
        try {
            JsonNode header = JSON.readTree(decode(parts[0]));
            if (!"ES256".equals(header.path("alg").asText())) {
                throw new IllegalArgumentException("Invalid transaction");
            }
            List<X509Certificate> chain = certificates(header.path("x5c"));
            if (chain.isEmpty()) {
                throw new IllegalArgumentException("Invalid transaction");
            }
            verifyChain(chain);
            byte[] signingInput = (parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII);
            Signature signature = Signature.getInstance("SHA256withECDSA");
            signature.initVerify(chain.get(0).getPublicKey());
            signature.update(signingInput);
            if (!signature.verify(joseEs256ToDer(decode(parts[2])))) {
                throw new IllegalArgumentException("Invalid transaction");
            }
            return DecodedTransaction.from(JSON.readTree(decode(parts[1])));
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (GeneralSecurityException | IOException ex) {
            throw new IllegalArgumentException("Invalid transaction", ex);
        }
    }

    private void verifyChain(List<X509Certificate> chain) throws GeneralSecurityException {
        CertificateFactory factory = CertificateFactory.getInstance("X.509");
        CertPath path = factory.generateCertPath(chain);
        PKIXParameters params = new PKIXParameters(Set.of(new TrustAnchor(appleRoot, null)));
        params.setRevocationEnabled(false);
        CertPathValidator.getInstance("PKIX").validate(path, params);
    }

    private static List<X509Certificate> certificates(JsonNode x5c) throws GeneralSecurityException, IOException {
        if (x5c == null || !x5c.isArray() || x5c.isEmpty()) {
            return List.of();
        }
        CertificateFactory factory = CertificateFactory.getInstance("X.509");
        List<X509Certificate> certs = new ArrayList<>();
        for (JsonNode node : x5c) {
            byte[] der = Base64.getDecoder().decode(node.asText());
            certs.add((X509Certificate) factory.generateCertificate(new ByteArrayInputStream(der)));
        }
        return certs;
    }

    private static byte[] decode(String part) {
        return Base64.getUrlDecoder().decode(part);
    }

    private static byte[] joseEs256ToDer(byte[] jose) throws IOException {
        if (jose == null || jose.length != 64) {
            throw new IllegalArgumentException("Invalid transaction");
        }
        byte[] r = unsigned(Arrays.copyOfRange(jose, 0, 32));
        byte[] s = unsigned(Arrays.copyOfRange(jose, 32, 64));
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(0x30);
        int body = 2 + r.length + 2 + s.length;
        out.write(body);
        out.write(0x02);
        out.write(r.length);
        out.write(r);
        out.write(0x02);
        out.write(s.length);
        out.write(s);
        return out.toByteArray();
    }

    private static byte[] unsigned(byte[] value) {
        int offset = 0;
        while (offset < value.length - 1 && value[offset] == 0) {
            offset++;
        }
        byte[] trimmed = Arrays.copyOfRange(value, offset, value.length);
        if ((trimmed[0] & 0x80) != 0) {
            byte[] padded = new byte[trimmed.length + 1];
            System.arraycopy(trimmed, 0, padded, 1, trimmed.length);
            return padded;
        }
        return trimmed;
    }

    private static X509Certificate loadAppleRoot() {
        try (InputStream stream = AppleJwsVerifier.class.getResourceAsStream(ROOT_RESOURCE)) {
            if (stream == null) {
                throw new IllegalStateException("Missing Apple root certificate");
            }
            return (X509Certificate) CertificateFactory.getInstance("X.509").generateCertificate(stream);
        } catch (GeneralSecurityException | IOException ex) {
            throw new IllegalStateException("Unable to load Apple root certificate", ex);
        }
    }

    record DecodedTransaction(
            String productId,
            String originalTransactionId,
            String transactionId,
            String bundleId,
            String type,
            String environment,
            String appAccountToken,
            Instant expiresAt,
            Instant revokedAt) {

        static DecodedTransaction from(JsonNode payload) {
            return new DecodedTransaction(
                    text(payload, "productId"),
                    text(payload, "originalTransactionId"),
                    text(payload, "transactionId"),
                    text(payload, "bundleId"),
                    text(payload, "type"),
                    text(payload, "environment"),
                    text(payload, "appAccountToken"),
                    instant(payload, "expiresDate"),
                    instant(payload, "revocationDate"));
        }

        boolean subscription() {
            return "Auto-Renewable Subscription".equals(type);
        }

        private static String text(JsonNode payload, String field) {
            JsonNode node = payload.get(field);
            return node == null || node.isNull() ? "" : node.asText("");
        }

        private static Instant instant(JsonNode payload, String field) {
            JsonNode node = payload.get(field);
            if (node == null || node.isNull()) {
                return null;
            }
            long value = node.isNumber() ? node.asLong() : parseEpoch(node.asText());
            return value <= 0 ? null : Instant.ofEpochMilli(value);
        }

        private static long parseEpoch(String raw) {
            if (raw == null || raw.isBlank()) {
                return 0;
            }
            try {
                return Long.parseLong(raw.trim());
            } catch (NumberFormatException ex) {
                return 0;
            }
        }
    }
}
