package com.dh.dentalClinicMVC.audit;

import com.dh.dentalClinicMVC.dto.DentistRequestDTO;
import com.dh.dentalClinicMVC.dto.DentistRequestMapper;
import com.dh.dentalClinicMVC.dto.PatientRequestDTO;
import com.dh.dentalClinicMVC.dto.PatientRequestMapper;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Set;

// One-time, read-only validation audit (proposal D4 / design Decision 6):
// loads every persisted Patient/Dentist, maps it to its request DTO using
// the same mappers the controllers use, and runs Bean Validation against it
// to surface rows that would fail the new write-endpoint constraints.
//
// STRICTLY READ-ONLY: only repository.findAll() reads are performed here.
// No save/update/delete call exists in this class, and none must be added.
//
// Disabled by default; enable once via --app.validation-audit.enabled=true.
@Component
@ConditionalOnProperty(name = "app.validation-audit.enabled", havingValue = "true")
public class ValidationAuditRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ValidationAuditRunner.class);

    private final IPatientRepository patientRepository;
    private final IDentistRepository dentistRepository;
    private final Validator validator;

    public ValidationAuditRunner(IPatientRepository patientRepository,
                                  IDentistRepository dentistRepository,
                                  Validator validator) {
        this.patientRepository = patientRepository;
        this.dentistRepository = dentistRepository;
        this.validator = validator;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("ValidationAuditRunner: starting read-only validation audit...");
        int patientViolations = auditPatients();
        int dentistViolations = auditDentists();
        log.info("ValidationAuditRunner: audit complete — {} patient row(s) with violations, {} dentist row(s) with violations.",
                patientViolations, dentistViolations);
    }

    private int auditPatients() {
        int violatingRows = 0;
        for (Patient patient : patientRepository.findAll()) {
            PatientRequestDTO dto = PatientRequestMapper.toRequestDTO(patient);
            Set<ConstraintViolation<PatientRequestDTO>> violations = validator.validate(dto);
            if (!violations.isEmpty()) {
                violatingRows++;
                for (ConstraintViolation<PatientRequestDTO> violation : violations) {
                    log.warn("ValidationAudit: Patient id={} field={} violation={}",
                            patient.getId(), violation.getPropertyPath(), violation.getMessage());
                }
            }
        }
        return violatingRows;
    }

    private int auditDentists() {
        int violatingRows = 0;
        for (Dentist dentist : dentistRepository.findAll()) {
            DentistRequestDTO dto = DentistRequestMapper.toRequestDTO(dentist);
            Set<ConstraintViolation<DentistRequestDTO>> violations = validator.validate(dto);
            if (!violations.isEmpty()) {
                violatingRows++;
                for (ConstraintViolation<DentistRequestDTO> violation : violations) {
                    log.warn("ValidationAudit: Dentist id={} field={} violation={}",
                            dentist.getId(), violation.getPropertyPath(), violation.getMessage());
                }
            }
        }
        return violatingRows;
    }
}
