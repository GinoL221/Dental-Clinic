-- V4__enforce_user_role_matches_user_type.sql
-- Enforce the user-kind invariant at the database level: users.user_type (the JOINED
-- discriminator written by Hibernate) and users.role must describe the same user kind.
-- Discovered discriminator values (EntityRoleTypeConsistencyTest): 'User', 'Patient', 'Dentist'.
-- MySQL-only by design: Flyway runs exclusively in the `prod` profile
-- (application-prod.properties:8). test/dev/e2e use H2 with flyway.enabled=false.
-- V1-V4 are still exercised outside prod by FlywayV4UserTypeCheckTest (H2 MODE=MySQL).
-- Named constraint so a re-run lineage can be inspected with a single query; MySQL 8.0.16+
-- enforces CHECK constraints and rejects duplicate names, so no IF NOT EXISTS dance is needed.

ALTER TABLE users
    ADD CONSTRAINT chk_user_role_matches_user_type CHECK (
        (user_type = 'User' AND role = 'ADMIN')
        OR (user_type = 'Patient' AND role = 'PATIENT')
        OR (user_type = 'Dentist' AND role = 'DENTIST'));
