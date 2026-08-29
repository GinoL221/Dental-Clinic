-- V2__enforce_user_role_not_null.sql
-- Backfill BEFORE the constraint: a single row with role NULL would abort the ALTER.
-- MySQL-only by design: Flyway runs exclusively in the `prod` profile
-- (application-prod.properties:8). test/dev/e2e use H2 with flyway.enabled=false.
UPDATE users SET role = 'PATIENT' WHERE role IS NULL;

-- MODIFY COLUMN requires restating the full column definition. Restating the ENUM
-- also converges the `baseline-on-migrate` lineage (where V1 was marked applied
-- without running and the column may be a Hibernate-generated VARCHAR) to the
-- type V1 intended.
ALTER TABLE users
    MODIFY COLUMN role ENUM('ADMIN', 'DENTIST', 'PATIENT') NOT NULL;
