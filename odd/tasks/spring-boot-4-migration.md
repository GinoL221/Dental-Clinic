# Spring Boot 4.1.2 Migration

Status: VERIFYING
Branch: `feat/spring-boot-4-migration`
Risk: high (item 2: Spring Security 7, item 5: dependencies/Boot 4.1.2, item 1: Flyway/Hibernate 7)

## Specs

- S1: `backend/pom.xml` upgrades `spring-boot-starter-parent` to `4.1.2` (latest 4.1.x with OSS support through July 2027), adopts Boot 4 modular starters (`spring-boot-starter-flyway`, Boot 4 test starters, H2 console starter if dev/e2e uses `spring.h2.console`), upgrades `springdoc-openapi-starter-webmvc-ui` to Boot 4-compatible `3.x`, and upgrades `jjwt` (`0.11.5` → `0.13.0`), compiling cleanly under `-Xlint:deprecation -Werror`.
- S2: All `backend/src/main/**` classes compile under `-Xlint:deprecation -Werror` and preserve existing runtime HTTP, security, JWT, OpenAPI (`/v3/api-docs` + `ErrorResponse` schema), Flyway V1–V4, and JPA/Hibernate contracts (Jackson 3 `tools.jackson`, Security 7 `DaoAuthenticationProvider`/`SecurityFilterChain`, `JwtService`, `EnvironmentPostProcessor`).
- S3: All `backend/src/test/**` suites compile and pass (`@MockitoBean`, Boot 4 `@AutoConfigureMockMvc`/`@DataJpaTest`, Jackson 3 `ObjectMapper`/`JsonNode`, `Jwts`, `DaoAuthenticationProvider`), keeping 295+ backend tests green without weakening assertions.
- S4: Spotless (`./mvnw spotless:check`), full backend suite (`./mvnw test`), full-stack E2E (`npm run test:e2e:fullstack` on alternate ports), and version docs (`AGENTS.md`/`README.md` if applicable) are updated and verified cleanly before merge.

## Tasks

- [x] T1 (S1) `backend/pom.xml` upgrade to Boot `4.1.2`, modular starters, `springdoc 3.x`, `jjwt 0.13.0` | route: inline | commit: feat/spring-boot-4-migration
- [x] T2 (S2) Migrate `backend/src/main/**` to compile cleanly under `-Xlint:deprecation -Werror` | route: inline / worker | commit: feat/spring-boot-4-migration
- [x] T3 (S3) Migrate `backend/src/test/**` and pass full `./mvnw spotless:check && ./mvnw test` | route: worker | commit: feat/spring-boot-4-migration
- [ ] T4 (S4) Docs sync, `gentle-ai-verify`, full-stack E2E (`18080`/`14173`), and native review | route: verify + review | commit: pending

## Log

- L1: User requested Spring Boot security patch upgrade and chose Option B (`4.1.2`, active OSS support through 2027-07-31) after reviewing EOL status of 3.x (3.5.16 ended OSS 2026-06-30) and 4.0 (2026-12-31).
- L2: `gentle-ai-explore` (`mwg19p1l-1-evzt`) mapped all affected paths: 2 main + 21 test Jackson files, 3 `@MockBean`, 27 `@AutoConfigureMockMvc`, 1 `@DataJpaTest`, 2 `EnvironmentPostProcessor`, 4 `jjwt` files, `ApplicationConfig` + `SecurityConfiguration` + 1 characterization test, `ErrorResponseCustomiser` + `OpenApiConfiguration`, Flyway + 6 JPA entities + 4 properties files.
- L3: T1-T3 completed. `backend/pom.xml` upgraded to `4.1.2`, `springdoc 3.2.0`, `jjwt 0.13.0`, modular starters (`spring-boot-starter-webmvc`, `spring-boot-starter-flyway`, `spring-boot-h2console`, Boot 4 test starters), plus `h2.version=2.5.252` (Boot 4.1.2 default `2.4.240` hits upstream `#4291`/`#4342` `ConditionInConstantSet` database-closed bug on Hibernate 7 discriminator CHECK constraints in `@DataJpaTest`). Fixed `SecurityConfiguration.java:91` (`"dentistAdd.html"` → `"/dentistAdd.html"` for Security 7 `PathPatternRequestMatcher`). `gentle-ai-worker` (`mwg1j9h4-2-kpkk`) migrated 31 test files (`@AutoConfigureMockMvc`, `@DataJpaTest`, `@MockitoBean`, Jackson 3, Security 7 `DaoAuthenticationProvider`, `jjwt 0.13.0`).
- L4: `./mvnw -B spotless:check && ./mvnw -B test` passed (295 run, 0 failures, 0 errors, 3 pre-existing skipped) under `-Xlint:deprecation -Werror`; `npm run test:e2e:fullstack` on `18080`/`14173` passed **46/46** (45.9s); `AGENTS.md`, `README.md`, `docs/product.md` updated to Spring Boot 4 / 4.1.
- L5: `gentle-ai-verify` (`mwg1zjmg-3-a6y3`) independently verified `spotless:check` (147 files), `clean test-compile` under `-Xlint:deprecation -Werror`, and 73/73 critical security/JPA/Flyway/OpenAPI/JWT tests (0 failures, 0 errors, 0 skipped): S1 PASS, S2 PASS, S3/S4 focused PASS. Note: Hibernate runtime deprecation warning `HHH90000025` for explicit `hibernate.dialect` remains pre-existing in properties.
