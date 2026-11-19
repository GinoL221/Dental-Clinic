package com.dh.dentalClinicMVC.configuration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.mock.env.MockEnvironment;

/**
 * Item 7: app.jwt.secret must have no hardcoded fallback under the dev profile, matching
 * application-prod.properties's pattern. A full fail-fast Spring context test (unset env var ->
 * context load failure) is impractical in this test harness because the test classpath supplies its
 * own app.jwt.secret via src/test/resources/application.properties, independent of any dev-profile
 * fallback. This static-config assertion is the accepted alternative per spec.
 */
class JwtSecretConfigurationTest {

  private static final Path DEV_PROPERTIES_PATH =
      Path.of("src", "main", "resources", "application-dev.properties");

  @Test
  void devProfileJwtSecretHasNoFallbackDefault() throws IOException {
    String content = Files.readString(DEV_PROPERTIES_PATH, StandardCharsets.UTF_8);

    assertTrue(
        content.contains("app.jwt.secret=${JWT_SECRET}"),
        "application-dev.properties must define app.jwt.secret=${JWT_SECRET} with no default");
    assertFalse(
        content.contains("${JWT_SECRET:"),
        "application-dev.properties must not contain a ${JWT_SECRET:<fallback>} pattern");
  }

  @Test
  void postProcessorRejectsNonBase64Secret() {
    JwtSecretEnvironmentPostProcessor processor = new JwtSecretEnvironmentPostProcessor();
    MockEnvironment env = new MockEnvironment().withProperty("app.jwt.secret", "not-valid-base64!");

    IllegalStateException ex =
        assertThrows(
            IllegalStateException.class,
            () -> processor.postProcessEnvironment(env, new SpringApplication()));
    assertTrue(ex.getMessage().contains("Base64"));
    assertNotNull(ex.getCause());
  }

  @Test
  void postProcessorRejectsShortDecodedSecret() {
    JwtSecretEnvironmentPostProcessor processor = new JwtSecretEnvironmentPostProcessor();
    String shortBase64 = Base64.getEncoder().encodeToString(new byte[16]);
    MockEnvironment env = new MockEnvironment().withProperty("app.jwt.secret", shortBase64);

    IllegalStateException ex =
        assertThrows(
            IllegalStateException.class,
            () -> processor.postProcessEnvironment(env, new SpringApplication()));
    assertTrue(ex.getMessage().contains("32 bytes"));
  }

  @Test
  void postProcessorAcceptsValid32ByteBase64Secret() {
    JwtSecretEnvironmentPostProcessor processor = new JwtSecretEnvironmentPostProcessor();
    String validBase64 = Base64.getEncoder().encodeToString(new byte[32]);
    MockEnvironment env = new MockEnvironment().withProperty("app.jwt.secret", validBase64);

    assertDoesNotThrow(() -> processor.postProcessEnvironment(env, new SpringApplication()));
  }
}
