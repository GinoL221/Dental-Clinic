package com.dh.dentalClinicMVC.configuration;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.repository.IAddressRepository;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.repository.ISpecialtyRepository;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import java.util.EnumMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("dev")
@TestPropertySource(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:data-initializer-seed-integration-test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
      "spring.datasource.username=sa",
      "spring.datasource.password=sa",
      "spring.datasource.driver-class-name=org.h2.Driver",
      "spring.flyway.enabled=false",
      "spring.jpa.hibernate.ddl-auto=create-drop",
      "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
      "spring.sql.init.mode=never",
      "app.jwt.secret=dGVzdFNlY3JldEtleUZvclRlc3RpbmdPbmx5MTIzNDU2Nzg="
    })
class DataInitializerSeedIntegrationTest {
  private static final SeedSnapshot EXPECTED =
      new SeedSnapshot(
          6,
          15,
          4,
          10,
          10,
          35,
          Map.of(
              AppointmentStatus.COMPLETED,
              15L,
              AppointmentStatus.CANCELLED,
              5L,
              AppointmentStatus.IN_PROGRESS,
              3L,
              AppointmentStatus.SCHEDULED,
              12L));

  @Autowired private DataInitializer dataInitializer;
  @Autowired private ISpecialtyRepository specialtyRepository;
  @Autowired private IUserRepository userRepository;
  @Autowired private IDentistRepository dentistRepository;
  @Autowired private IPatientRepository patientRepository;
  @Autowired private IAddressRepository addressRepository;
  @Autowired private IAppointmentRepository appointmentRepository;

  @Test
  void seedCreatesExpectedDataAndRerunIsIdempotent() throws Exception {
    SeedSnapshot initial = snapshot();

    assertEquals(EXPECTED, initial);

    dataInitializer.run(new DefaultApplicationArguments());

    assertEquals(initial, snapshot());
  }

  private SeedSnapshot snapshot() {
    Map<AppointmentStatus, Long> statuses =
        appointmentRepository.findAll().stream()
            .collect(
                Collectors.groupingBy(
                    Appointment::getStatus,
                    () -> new EnumMap<>(AppointmentStatus.class),
                    Collectors.counting()));
    return new SeedSnapshot(
        specialtyRepository.count(),
        userRepository.count(),
        dentistRepository.count(),
        patientRepository.count(),
        addressRepository.count(),
        appointmentRepository.count(),
        Map.copyOf(statuses));
  }

  private record SeedSnapshot(
      long specialties,
      long users,
      long dentists,
      long patients,
      long addresses,
      long appointments,
      Map<AppointmentStatus, Long> statuses) {}
}
