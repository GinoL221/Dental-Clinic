-- Initial schema for the joined JPA model.

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_type VARCHAR(31) NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    password VARCHAR(255),
    role ENUM('ADMIN', 'DENTIST', 'PATIENT'),
    PRIMARY KEY (id),
    CONSTRAINT uk_user_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE addresses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    street VARCHAR(255) NOT NULL,
    number INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    province VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE specialties (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT uk_specialty_name UNIQUE (name)
) ENGINE=InnoDB;

CREATE TABLE dentists (
    id BIGINT NOT NULL,
    registration_number INT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_dentist_registration_number UNIQUE (registration_number),
    CONSTRAINT fk_dentist_user FOREIGN KEY (id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE patients (
    id BIGINT NOT NULL,
    card_identity INT NOT NULL,
    admission_date DATE NOT NULL,
    address_id BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT uk_patient_card_identity UNIQUE (card_identity),
    CONSTRAINT uk_patient_address UNIQUE (address_id),
    CONSTRAINT fk_patient_user FOREIGN KEY (id) REFERENCES users (id),
    CONSTRAINT fk_patient_address FOREIGN KEY (address_id) REFERENCES addresses (id)
) ENGINE=InnoDB;

CREATE TABLE dentist_specialty (
    dentist_id BIGINT NOT NULL,
    specialty_id BIGINT NOT NULL,
    PRIMARY KEY (dentist_id, specialty_id),
    CONSTRAINT fk_dentist_specialty_dentist
        FOREIGN KEY (dentist_id) REFERENCES dentists (id),
    CONSTRAINT fk_dentist_specialty_specialty
        FOREIGN KEY (specialty_id) REFERENCES specialties (id)
) ENGINE=InnoDB;

CREATE TABLE appointments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    patient_id BIGINT,
    dentist_id BIGINT NOT NULL,
    date DATE NOT NULL,
    time TIME(6) NOT NULL,
    description VARCHAR(500),
    status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL,
    active_slot INT GENERATED ALWAYS AS (
        CASE WHEN status <> 'CANCELLED' THEN 1 ELSE NULL END
    ),
    PRIMARY KEY (id),
    CONSTRAINT uk_appointment_active_dentist_slot
        UNIQUE (dentist_id, date, time, active_slot),
    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_appointment_dentist FOREIGN KEY (dentist_id) REFERENCES dentists (id)
) ENGINE=InnoDB;

CREATE INDEX idx_user_email ON users (email);
CREATE INDEX idx_patient_card_identity ON patients (card_identity);
CREATE INDEX idx_dentist_registration_number ON dentists (registration_number);
CREATE INDEX idx_appointment_date ON appointments (date);
CREATE INDEX idx_appointment_status ON appointments (status);
CREATE INDEX idx_appointment_patient ON appointments (patient_id);
CREATE INDEX idx_appointment_dentist ON appointments (dentist_id);
