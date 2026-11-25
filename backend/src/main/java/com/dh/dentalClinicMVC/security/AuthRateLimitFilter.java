package com.dh.dentalClinicMVC.security;

import com.dh.dentalClinicMVC.exception.ErrorResponse;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;
import lombok.NonNull;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

/**
 * Fixed-window per-client-IP and per-endpoint rate limiter for authentication endpoints ({@code
 * POST /auth/login}, {@code POST /auth/register}, {@code POST /auth/change-password}, and {@code
 * GET/HEAD /auth/check-email}) backed by Caffeine.
 *
 * <p>Buckets are keyed by {@code clientKey + ":" + bucketScope}, where {@code POST /auth/login} and
 * {@code POST /auth/register} share the {@code "auth"} scope, {@code POST /auth/change-password}
 * uses {@code "change-password"}, and {@code GET/HEAD /auth/check-email} uses {@code
 * "check-email"}. When {@code app.rate-limit.bff-shared-secret} is configured (non-blank), requests
 * presenting a matching {@code X-BFF-Auth} header (constant-time comparison) and a validated {@code
 * X-Client-IP} header are keyed by {@code "bff:<clientIp>"}; otherwise keying falls back
 * fail-closed to {@code request.getRemoteAddr()}.
 *
 * <p>Intentionally instantiated inside {@code SecurityConfiguration} (not registered as a servlet
 * {@code @Bean}) so it executes exactly once per request inside {@code SecurityFilterChain}.
 */
public class AuthRateLimitFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(AuthRateLimitFilter.class);
  private static final String CHANGE_PASSWORD_PATH = "/auth/change-password";
  private static final Set<String> PROTECTED_POST_PATHS =
      Set.of("/auth/login", "/auth/register", CHANGE_PASSWORD_PATH);
  private static final String PROTECTED_GET_PATH = "/auth/check-email";
  private static final String BFF_AUTH_HEADER = "X-BFF-Auth";
  private static final String BFF_CLIENT_IP_HEADER = "X-Client-IP";
  private static final int MAX_CLIENT_IP_LENGTH = 64;
  private static final int MAX_TRACKED_CLIENTS = 10_000;

  private final ObjectMapper objectMapper;
  private final boolean enabled;
  private final int maxRequests;
  private final long windowMillis;
  private final byte[] trustedBffSecret;
  private final Clock clock;
  private final Cache<String, WindowState> buckets;

  private record WindowState(long windowStartMillis, int count) {}

  public AuthRateLimitFilter(
      ObjectMapper objectMapper, boolean enabled, int maxRequests, long windowSeconds) {
    this(objectMapper, enabled, maxRequests, windowSeconds, "", Clock.systemUTC());
  }

  public AuthRateLimitFilter(
      ObjectMapper objectMapper,
      boolean enabled,
      int maxRequests,
      long windowSeconds,
      @Nullable String bffSharedSecret) {
    this(objectMapper, enabled, maxRequests, windowSeconds, bffSharedSecret, Clock.systemUTC());
  }

  AuthRateLimitFilter(
      ObjectMapper objectMapper,
      boolean enabled,
      int maxRequests,
      long windowSeconds,
      Clock clock) {
    this(objectMapper, enabled, maxRequests, windowSeconds, "", clock);
  }

  AuthRateLimitFilter(
      ObjectMapper objectMapper,
      boolean enabled,
      int maxRequests,
      long windowSeconds,
      @Nullable String bffSharedSecret,
      Clock clock) {
    this.objectMapper = objectMapper;
    this.enabled = enabled;
    this.maxRequests = Math.max(1, maxRequests);
    long effectiveWindowSeconds = Math.max(1L, windowSeconds);
    this.windowMillis = effectiveWindowSeconds * 1000L;
    String normalizedSecret = bffSharedSecret == null ? "" : bffSharedSecret.trim();
    this.trustedBffSecret =
        normalizedSecret.isEmpty()
            ? new byte[0]
            : normalizedSecret.getBytes(StandardCharsets.UTF_8);
    this.clock = clock;
    this.buckets =
        Caffeine.newBuilder()
            .maximumSize(MAX_TRACKED_CLIENTS)
            .expireAfterWrite(Duration.ofSeconds(effectiveWindowSeconds))
            .build();
  }

  @Override
  protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
    if (!enabled) {
      return true;
    }
    String path = resolvePathWithoutContext(request);
    if (HttpMethod.POST.matches(request.getMethod())) {
      return !PROTECTED_POST_PATHS.contains(path);
    }
    if (HttpMethod.GET.matches(request.getMethod())
        || HttpMethod.HEAD.matches(request.getMethod())) {
      return !PROTECTED_GET_PATH.equals(path);
    }
    return true;
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {

    String clientKey = resolveClientKey(request);
    String path = resolvePathWithoutContext(request);
    String bucketKey = clientKey + ":" + resolveBucketScope(path);
    long now = clock.millis();
    AtomicLong retryAfterSeconds = new AtomicLong(0L);

    WindowState updated =
        buckets
            .asMap()
            .compute(
                bucketKey,
                (key, current) -> {
                  if (current == null || (now - current.windowStartMillis()) >= windowMillis) {
                    return new WindowState(now, 1);
                  }
                  if (current.count() >= maxRequests) {
                    long remainingMillis =
                        Math.max(1L, windowMillis - (now - current.windowStartMillis()));
                    retryAfterSeconds.set((remainingMillis + 999L) / 1000L);
                    return current;
                  }
                  return new WindowState(current.windowStartMillis(), current.count() + 1);
                });

    if (retryAfterSeconds.get() > 0L && updated != null) {
      log.warn(
          "Auth rate limit exceeded for path={} client={} count={}",
          request.getRequestURI(),
          clientKey,
          updated.count());
      writeTooManyRequests(request, response, retryAfterSeconds.get());
      return;
    }

    filterChain.doFilter(request, response);
  }

  private void writeTooManyRequests(
      HttpServletRequest request, HttpServletResponse response, long retryAfterSeconds)
      throws IOException {
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Demasiadas solicitudes")
            .message(
                "Demasiados intentos en poco tiempo. Esperá unos segundos e intentá nuevamente.")
            .path(request.getRequestURI())
            .status(HttpStatus.TOO_MANY_REQUESTS.value())
            .timestamp(LocalDateTime.now())
            .build();

    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
    response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    objectMapper.writeValue(response.getWriter(), error);
  }

  private static String resolveBucketScope(String path) {
    if (PROTECTED_GET_PATH.equals(path)) {
      return "check-email";
    }
    if (CHANGE_PASSWORD_PATH.equals(path)) {
      return "change-password";
    }
    return "auth";
  }

  private String resolveClientKey(HttpServletRequest request) {
    if (trustedBffSecret.length > 0) {
      String bffAuth = request.getHeader(BFF_AUTH_HEADER);
      String forwardedIp = request.getHeader(BFF_CLIENT_IP_HEADER);
      if (bffAuth != null
          && !bffAuth.isBlank()
          && MessageDigest.isEqual(
              bffAuth.trim().getBytes(StandardCharsets.UTF_8), trustedBffSecret)
          && forwardedIp != null) {
        String trimmedIp = forwardedIp.trim();
        if (isSafeClientIpToken(trimmedIp)) {
          return "bff:" + trimmedIp;
        }
      }
    }
    String remoteAddr = request.getRemoteAddr();
    return (remoteAddr != null && !remoteAddr.isBlank()) ? remoteAddr : "unknown";
  }

  private static boolean isSafeClientIpToken(String value) {
    if (value.isEmpty() || value.length() > MAX_CLIENT_IP_LENGTH) {
      return false;
    }
    for (int i = 0; i < value.length(); i++) {
      char ch = value.charAt(i);
      boolean valid =
          (ch >= '0' && ch <= '9')
              || (ch >= 'a' && ch <= 'f')
              || (ch >= 'A' && ch <= 'F')
              || ch == '.'
              || ch == ':'
              || ch == '%'
              || ch == '-';
      if (!valid) {
        return false;
      }
    }
    return true;
  }

  private static String resolvePathWithoutContext(HttpServletRequest request) {
    String uri = request.getRequestURI();
    String contextPath = request.getContextPath();
    if (contextPath != null && !contextPath.isEmpty() && uri.startsWith(contextPath)) {
      return uri.substring(contextPath.length());
    }
    return uri;
  }
}
