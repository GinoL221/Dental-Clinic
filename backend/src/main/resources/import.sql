-- import.sql: datos iniciales para la base

-- Usuarios base (ADMIN)
INSERT INTO users (first_name, last_name, email, password, role, user_type) VALUES ('Admin', 'Sistema', 'admin@dentalclinic.com', '$2a$10$CwTycUXWue0Thq9StjUM0uBUcpkmhBr.4NQJZ6lq3ZUklA.J5eOzq', 'ADMIN', 'User'); -- password: admin123

-- Dentistas (heredan de User con tabla JOINED)
INSERT INTO users (first_name, last_name, email, password, role, user_type) VALUES ('María', 'González', 'maria.gonzalez@dentalclinic.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'DENTIST', 'Dentist'); -- password: maria123
INSERT INTO users (first_name, last_name, email, password, role, user_type) VALUES ('Carlos', 'Rodríguez', 'carlos.rodriguez@dentalclinic.com', '$2a$10$oxSJqffVU3xZ6Rq8NAQIBOYyBEhAGhS.q8ZSvGz/vkGQj.Wt.5hWK', 'DENTIST', 'Dentist'); -- password: carlos123
INSERT INTO users (first_name, last_name, email, password, role, user_type) VALUES ('Ana', 'Martínez', 'ana.martinez@dentalclinic.com', '$2a$10$M8VD9ZPsH5VGJ8NRDNF8XeZJGGHf7BLNYGLDDGGxZ3GqWUEGF7pGm', 'DENTIST', 'Dentist'); -- password: ana123
INSERT INTO users (first_name, last_name, email, password, role, user_type) VALUES ('Luis', 'Fernández', 'luis.fernandez@dentalclinic.com', '$2a$10$P7QVE2GHN9KJL6MJQNF8XeZJGGHf7BLNYGLDDGGxZ3GqWUEGF7pGm', 'DENTIST', 'Dentist'); -- password: luis123

-- Tabla de dentistas (JOINED con users)
INSERT INTO dentists (id, registration_number) VALUES (2, 12345);
INSERT INTO dentists (id, registration_number) VALUES (3, 23456);
INSERT INTO dentists (id, registration_number) VALUES (4, 34567);
INSERT INTO dentists (id, registration_number) VALUES (5, 45678);

-- Direcciones para pacientes
INSERT INTO addresses (street, number, location, province) VALUES ('Av. Corrientes', 1234, 'CABA', 'CABA');
INSERT INTO addresses (street, number, location, province) VALUES ('San Martín', 567, 'San Isidro', 'Buenos Aires');
INSERT INTO addresses (street, number, location, province) VALUES ('Rivadavia', 890, 'Córdoba', 'Córdoba');
INSERT INTO addresses (street, number, location, province) VALUES ('Belgrano', 456, 'Rosario', 'Santa Fe');
INSERT INTO addresses (street, number, location, province) VALUES ('Mitre', 789, 'La Plata', 'Buenos Aires');
INSERT INTO addresses (street, number, location, province) VALUES ('9 de Julio', 321, 'Mendoza', 'Mendoza');
INSERT INTO addresses (street, number, location, province) VALUES ('Sarmiento', 654, 'CABA', 'CABA');
INSERT INTO addresses (street, number, location, province) VALUES ('Maipú', 987, 'Mar del Plata', 'Buenos Aires');

-- Pacientes (heredan de User con tabla JOINED)
INSERT INTO users (first_name, last_name, email, password, role, user_type) VALUES ('Juan', 'Pérez', 'juan.perez@email.com', '$2a$10$T8VJE3GHN9KJL6MJQNF8XeZJGGHf7BLNYGLDDGGxZ3GqWUEGF7pGm', 'PATIENT', 'Patient'); -- password: juan123
INSERT INTO users (first_name, last_name, email, password, role, user_type) VALUES ('María', 'López', 'maria.lopez@email.com', '$2a$10$U9WKF4HIN0LKM7NKROF9YfaKHHIg8CMOZHMEEHIya4HrXVFHG8qHn', 'PATIENT', 'Patient'); -- password: maria456
INSERT INTO users (first_name, last_name, email, password, role, user_type) VALUES ('Carlos', 'García', 'carlos.garcia@email.com', '$2a$10$V0XLG5IJO1MLN8OLSPG0ZgbLIIJh9DNPaINFFIJzb5IsYWGIG9rIo', 'PATIENT', 'Patient'); -- password: carlos456
INSERT INTO users (first_name, last_name, email, password, role, user_type) VALUES ('Ana', 'Morales', 'ana.morales@email.com', '$2a$10$W1YMH6JKP2NMO9PMTQH1ahcMJJKi0EOQbJOGGJK0c6JtZXHJH0sJp', 'PATIENT', 'Patient'); -- password: ana456
INSERT INTO users (first_name, last_name, email, password, role, user_type) VALUES ('Pedro', 'Ruiz', 'pedro.ruiz@email.com', '$2a$10$X2ZNI7KLQ3ONP0QNURH2bicNKKLj1FPRcKPHHKL1d7KuaYIKI1tKq', 'PATIENT', 'Patient'); -- password: pedro789
INSERT INTO users (first_name, last_name, email, password, role, user_type) VALUES ('Laura', 'Silva', 'laura.silva@email.com', '$2a$10$Y3aOJ8LMR4POQ1ROVSJ3cjdOLLMk2GQSdLQIILM2e8LvbZJLJ2uLr', 'PATIENT', 'Patient'); -- password: laura789
INSERT INTO users (first_name, last_name, email, password, role, user_type) VALUES ('Diego', 'Torres', 'diego.torres@email.com', '$2a$10$Z4bPK9MNS5QPR2SPWTK4dkeQMMNl3HRTeNRJJMN3f9MwcaKMK3vMs', 'PATIENT', 'Patient'); -- password: diego000
INSERT INTO users (first_name, last_name, email, password, role, user_type) VALUES ('Sofía', 'Vega', 'sofia.vega@email.com', '$2a$10$A5cQL0NOU6QQS3TQXUL5elfRNNOm4ISUfNSKKNO4g0NxdbLNL4wNt', 'PATIENT', 'Patient'); -- password: sofia000

-- Tabla de pacientes (JOINED con users, con direcciones)
INSERT INTO patients (id, card_identity, admission_date, address_id) VALUES (6, 12345678, '2024-01-15', 1);
INSERT INTO patients (id, card_identity, admission_date, address_id) VALUES (7, 23456789, '2024-02-20', 2);
INSERT INTO patients (id, card_identity, admission_date, address_id) VALUES (8, 34567890, '2024-03-10', 3);
INSERT INTO patients (id, card_identity, admission_date, address_id) VALUES (9, 45678901, '2024-04-05', 4);
INSERT INTO patients (id, card_identity, admission_date, address_id) VALUES (10, 56789012, '2024-05-12', 5);
INSERT INTO patients (id, card_identity, admission_date, address_id) VALUES (11, 67890123, '2024-06-18', 6);
INSERT INTO patients (id, card_identity, admission_date, address_id) VALUES (12, 78901234, '2024-07-22', 7);
INSERT INTO patients (id, card_identity, admission_date, address_id) VALUES (13, 89012345, '2024-08-30', 8);

-- Citas con variedad de estados y fechas
INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (6, 2, '2024-12-15', '09:00:00', 'Control de rutina y limpieza dental', 'COMPLETED');
INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (7, 3, '2024-12-16', '10:30:00', 'Tratamiento de endodoncia molar superior', 'COMPLETED');
INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (8, 4, '2024-12-18', '14:00:00', 'Extracción de muela del juicio', 'COMPLETED');
INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (9, 2, '2024-12-20', '11:00:00', 'Colocación de brackets ortodóncicos', 'COMPLETED');
INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (10, 5, '2024-12-22', '15:30:00', 'Empaste de caries en premolar', 'COMPLETED');

INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (11, 2, '2025-01-15', '09:00:00', 'Control de ortodoncia mensual', 'SCHEDULED');
INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (12, 3, '2025-01-16', '10:30:00', 'Segunda sesión de endodoncia', 'SCHEDULED');
INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (13, 4, '2025-01-17', '14:00:00', 'Control post extracción', 'SCHEDULED');
INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (6, 5, '2025-01-18', '11:00:00', 'Limpieza dental semestral', 'SCHEDULED');
INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (7, 2, '2025-01-20', '15:30:00', 'Ajuste de ortodoncia', 'SCHEDULED');
INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (8, 3, '2025-01-22', '09:30:00', 'Evaluación para corona dental', 'SCHEDULED');
INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (9, 4, '2025-01-23', '16:00:00', 'Control de cicatrización', 'SCHEDULED');
INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (10, 5, '2025-01-25', '10:00:00', 'Blanqueamiento dental', 'SCHEDULED');

INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (11, 2, CURRENT_DATE, '11:00:00', 'Sesión de ortodoncia en curso', 'IN_PROGRESS');
INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (12, 3, CURRENT_DATE, '14:30:00', 'Tratamiento de conducto en progreso', 'IN_PROGRESS');

INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (13, 4, '2024-12-25', '16:00:00', 'Consulta general - Paciente canceló', 'CANCELLED');
INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) VALUES (6, 5, '2024-12-28', '09:00:00', 'Revisión ortodóncica - Reprogramada', 'CANCELLED');
