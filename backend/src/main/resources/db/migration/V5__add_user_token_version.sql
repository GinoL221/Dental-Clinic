-- V5__add_user_token_version.sql
-- Add per-user monotonic token_version counter so password changes and explicit logout
-- immediately invalidate previously issued stateless JWTs.
-- MySQL-only by design: Flyway runs exclusively in the `prod` profile
-- (application-prod.properties). test/dev/e2e use H2 with flyway.enabled=false.

ALTER TABLE users
    ADD COLUMN token_version INT NOT NULL DEFAULT 0;
