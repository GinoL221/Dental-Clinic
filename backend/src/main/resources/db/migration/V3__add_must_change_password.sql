-- V3__add_must_change_password.sql
-- Add flag indicating whether the user must change their password on next login.
-- Defaults to FALSE for existing users so their accounts remain active without disruption.
-- MySQL-only by design: Flyway runs exclusively in the `prod` profile
-- (application-prod.properties:8). test/dev/e2e use H2 with flyway.enabled=false.

ALTER TABLE users
    ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
