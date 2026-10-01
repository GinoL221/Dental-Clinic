# Backend advisories: classification and update plan

## Decision

Do not apply 100 individual upgrades. Prefer a coordinated Spring Boot 3.x BOM update, then review remaining overrides. No backend dependencies were changed by this assessment.

## Evidence and limits

### Freshness and E2E context

The advisory counts, versions, publisher assessments, and sources below describe the stored scan dated 2026-10-01; they have not been refreshed in this documentation closure. Do not infer a current release fix or vulnerability-free state from them. Separately, after earlier full-stack instability, a bounded quiet-window comparison passed 4/4 selected cases and the separately authorized full regression passed 46/46 once. This improves the regression evidence but does not establish transport-failure causality, deployment stability, or backend-upgrade safety. A backend upgrade still requires its own fresh regression and the compatibility/security validation listed below. These browser results do not alter the stored advisory scan.
Baseline: cd36391b8d2179030564775cad3d8ab757406213. Trivy 0.61.1 scanned a resolved CycloneDX 2.9.1 BOM including test dependencies. Advisory DB updated 2026-10-01 01:24:14Z. Report and executable JAR: external audit directory dental-remaining-audit.2pqeK8MB. The JAR was built with tests skipped; previous tests are separate evidence.

Structured report inspection counts **100 package/advisory findings, 99 unique IDs**: 9 CRITICAL, 39 HIGH, 37 MEDIUM, 15 LOW. Exact filename comparison against the JAR's 88 BOOT-INF/lib entries finds **96 findings in packaged libraries and 4 in non-packaged libraries**. Packaging is not proof of execution or exploitability, and does not establish actual deployment contents.

Correction to scout output: current backend/pom.xml has NO test scope on spring-security-test. The executable JAR actually contains spring-security-test-6.2.1.jar. CycloneDX's required/optional flags are NOT Maven runtime/test scopes. Do not use them as that classification.

## Complete affected-component matrix

Names below use Maven artifact IDs; versions and counts come from the stored scanner report. P = present in built JAR, T = absent from built JAR and introduced by the test starter. C/H/M/L = scanner severity counts, not application severity.

| Artifact               | Version | Count | C/H/M/L  | Packaging |
| ---------------------- | ------- | ----: | -------- | --------- |
| logback-core           | 1.4.14  |     6 | 0/0/2/4  | P         |
| jackson-core           | 2.15.3  |     2 | 0/1/1/0  | P         |
| jackson-databind       | 2.15.3  |    11 | 0/5/6/0  | P         |
| json-path              | 2.8.0   |     1 | 0/0/1/0  | T         |
| mysql-connector-j      | 8.1.0   |     1 | 0/1/0/0  | P         |
| json-smart             | 2.5.0   |     1 | 0/1/0/0  | T         |
| commons-lang3          | 3.13.0  |     1 | 0/0/1/0  | P         |
| log4j-api              | 2.21.1  |     1 | 0/0/1/0  | P         |
| tomcat-embed-core      | 10.1.17 |    35 | 7/16/7/5 | P         |
| tomcat-embed-websocket | 10.1.17 |     1 | 0/0/1/0  | P         |
| assertj-core           | 3.24.2  |     1 | 0/1/0/0  | T         |
| spring-boot            | 3.2.1   |     1 | 0/1/0/0  | P         |
| spring-data-commons    | 3.2.1   |     2 | 0/0/2/0  | P         |
| spring-security-core   | 6.2.1   |     3 | 0/2/1/0  | P         |
| spring-security-crypto | 6.2.1   |     1 | 0/1/0/0  | P         |
| spring-security-web    | 6.2.1   |     3 | 2/0/1/0  | P         |
| spring-context         | 6.1.2   |     2 | 0/0/1/1  | P         |
| spring-core            | 6.1.2   |     3 | 0/2/0/1  | P         |
| spring-expression      | 6.1.2   |     3 | 0/1/1/1  | P         |
| spring-web             | 6.1.2   |     6 | 0/3/3/0  | P         |
| spring-webmvc          | 6.1.2   |    14 | 0/4/8/2  | P         |
| xmlunit-core           | 2.9.1   |     1 | 0/0/0/1  | T         |

Most packaged versions are managed by Boot 3.2.1; springdoc 2.0.3 is separately pinned. Test-starter transitives are not production vulnerabilities merely because the aggregate BOM includes them. JSON parsing, server HTTP handling, auth and logging paths deserve higher-priority reachability review than unused optional features.

## Nine scanner-critical records

| ID             | Component       | Applicability assessment                                                                                                                                                                       |
| -------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CVE-2025-24813 | Tomcat          | Conditional: write-enabled Default Servlet, partial PUT and additional RCE/disclosure conditions. Writes are disabled by default; deployment overrides were not inspected.                     |
| CVE-2026-41293 | Tomcat          | Conditional HTTP/2 header validation; actual HTTP/2 serving configuration unknown. Apache calls this Low, unlike scanner Critical.                                                             |
| CVE-2026-43512 | Tomcat          | DIGEST preconditions; JWT app code does not show container DIGEST. Deployment unknown.                                                                                                         |
| CVE-2026-43515 | Tomcat          | Container method constraints; do not equate Spring matchers with container constraints.                                                                                                        |
| CVE-2026-65182 | Tomcat          | Container constraint path ordering; deployment configuration unknown. Apache labels Important.                                                                                                 |
| CVE-2026-65905 | Tomcat          | DIGEST replay preconditions; not shown in JWT app config.                                                                                                                                      |
| CVE-2026-68525 | Tomcat          | Container FORM auth with method-specific constraints; not shown in app. Apache labels Low.                                                                                                     |
| CVE-2024-38821 | Spring Security | Installed version is affected, but official advisory requires WebFlux. Observed app is Servlet/MVC, so the required feature is absent in the inspected configuration. Not an observed exploit. |
| CVE-2026-22732 | Spring Security | Official affected ranges do NOT list 6.2.x. Installed 6.2.1 scanner match is inconsistent with publisher ranges; retain for data-quality investigation, not confirmed applicable Critical.     |

Neither configuration inspection nor lack of an observed feature proves all deployments safe. No exploits were attempted. Other 91 records are aggregated by component; their individual reachability remains unproven.

## Upgrade plan

1. Correct spring-security-test to test scope in a separately authorized work unit, verifying backend tests and packaged dependency removal. This reduces unnecessary runtime exposure but does not remediate spring-security-web itself.
2. Evaluate a maintained Boot 3.x BOM on Java 21 rather than immediately moving to Boot 4. The retrieved Boot 3.5 documentation describes 3.5.16 and Security 6.5.11, but manages Tomcat 10.1.55. Therefore that documented BOM alone does NOT clear all stored Tomcat findings (some list 10.1.58 fixes). Verify release availability/support and compatible springdoc before selecting a concrete parent version.
3. Select the latest supported compatible Tomcat 10.1 patch only after reviewing the CURRENT Apache page. Stored findings suggest at least 10.1.58 for those records, while the current publisher also lists a regression affecting 10.1.55–10.1.59. Do not claim 10.1.58 fully clean; a narrowly justified tomcat.version override may be needed pending a newer BOM. Keep core/websocket modules aligned.
4. Let the selected BOM align Spring Framework, Security, Data, Jackson, Logback and database driver versions. Explicitly validate MySQL driver/Flyway module compatibility and springdoc. Avoid choosing one advisory's fixed version as a universal target.
5. For any separately authorized backend upgrade, run backend `./mvnw verify`, auth/ownership/session regression tests, actual MySQL fresh/upgrade/JPA validation, and a fresh full-stack browser regression. The earlier quiet-window full-stack run passed 46/46 once, but does not prove transport-failure causality or validate a future backend upgrade.
6. Rebuild the executable JAR, regenerate the aggregate and runtime-filtered inventory, scan with a fresh advisory DB, and compare resolved versions and remaining IDs. Record accepted false applicability with publisher evidence; do not globally suppress Critical findings.

## Retrieved primary sources

Retrieved during this follow-up (2026-10-01 session); pages are mutable, not pinned release evidence:

- Spring CVE-2024-38821, initially published 2024-10-22: https://spring.io/security/cve-2024-38821 — three required WebFlux/static-resource/non-permitAll conditions, 6.2.7 branch fix.
- Spring CVE-2026-22732, initially published 2026-03-19: https://spring.io/security/cve-2026-22732 — affected 6.3/6.4/6.5/7.0/5.8/5.7 ranges, no 6.2 range.
- Apache Tomcat 10 vulnerabilities: https://tomcat.apache.org/security-10.html — Default Servlet conditions, differing publisher severity, later HTTP/2 regression, branch-specific fixes.
- Spring Boot managed coordinates: https://docs.spring.io/spring-boot/3.5/appendix/dependency-versions/coordinates.html — observed 3.5.16/Security 6.5.11/Tomcat 10.1.55. This is a candidate compatibility reference, not proof of released-artifact availability or test success.

## Outcome

Classification and an actionable staged plan are complete at the component/critical-applicability level. Complete per-ID runtime reachability, deployment configuration and upgrade compatibility remain subsequent verification. No backend upgrades implemented.
