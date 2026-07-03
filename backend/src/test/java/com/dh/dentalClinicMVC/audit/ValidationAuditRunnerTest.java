package com.dh.dentalClinicMVC.audit;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dh.dentalClinicMVC.entity.Address;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IAddressRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Covers proposal D4 / design Decision 6: ValidationAuditRunner is a
// flag-gated, read-only ApplicationRunner. Two contexts are used because the
// bean's presence depends on the "app.validation-audit.enabled" property.
class ValidationAuditRunnerTest {

    @Nested
    @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
    class FlagOff {

        @Autowired
        private ApplicationContext applicationContext;

        @Test
        void whenFlagIsOff_runnerBeanIsNotLoaded() {
            assertEquals(0, applicationContext.getBeanNamesForType(ValidationAuditRunner.class).length,
                    "ValidationAuditRunner must not be registered when app.validation-audit.enabled is not set to true");
        }
    }

    @Nested
    @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE,
            properties = "app.validation-audit.enabled=true")
    @Transactional
    class FlagOn {

        @Autowired
        private ValidationAuditRunner validationAuditRunner;

        @Autowired
        private IPatientRepository patientRepository;

        @Autowired
        private IAddressRepository addressRepository;

        @Test
        void whenFlagIsOn_violatingRowIsLoggedAndNotMutated() throws Exception {
            Address address = new Address();
            address.setStreet("Main St");
            address.setNumber(100);
            address.setLocation("Springfield");
            address.setProvince("Buenos Aires");
            addressRepository.save(address);

            Patient invalidPatient = new Patient();
            invalidPatient.setFirstName(""); // violates @NotBlank on PatientRequestDTO
            invalidPatient.setLastName("Doe");
            invalidPatient.setEmail("invalid-patient@example.com");
            invalidPatient.setPassword("secret");
            invalidPatient.setRole(Role.PATIENT);
            invalidPatient.setCardIdentity(99999999);
            invalidPatient.setAdmissionDate(LocalDate.of(2024, 1, 1));
            invalidPatient.setAddress(address);
            invalidPatient = patientRepository.save(invalidPatient);
            Long patientId = invalidPatient.getId();

            Logger runnerLogger = (Logger) LoggerFactory.getLogger(ValidationAuditRunner.class);
            ListAppender<ILoggingEvent> appender = new ListAppender<>();
            appender.start();
            runnerLogger.addAppender(appender);

            try {
                validationAuditRunner.run(new DefaultApplicationArguments());
            } finally {
                runnerLogger.detachAppender(appender);
            }

            boolean violationLogged = appender.list.stream()
                    .anyMatch(event -> event.getLevel() == Level.WARN
                            && event.getFormattedMessage().contains("id=" + patientId)
                            && event.getFormattedMessage().contains("firstName"));
            assertTrue(violationLogged,
                    "Expected a WARN log entry reporting the firstName violation for patient id=" + patientId);

            Patient reloaded = patientRepository.findById(patientId).orElseThrow();
            assertEquals("", reloaded.getFirstName(), "Audit must be read-only: firstName must remain unchanged");
            assertEquals("Doe", reloaded.getLastName());
            assertEquals("invalid-patient@example.com", reloaded.getEmail());
            assertEquals(99999999, reloaded.getCardIdentity());
        }
    }
}
