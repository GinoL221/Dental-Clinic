package com.dh.dentalClinicMVC.configuration;

import com.dh.dentalClinicMVC.entity.Address;
import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.entity.User;
import com.dh.dentalClinicMVC.repository.IAddressRepository;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("e2e")
public class E2eDataInitializer implements ApplicationRunner {
  private final IUserRepository userRepository;
  private final IDentistRepository dentistRepository;
  private final IPatientRepository patientRepository;
  private final IAddressRepository addressRepository;
  private final IAppointmentRepository appointmentRepository;
  private final PasswordEncoder passwordEncoder;
  private final E2eSeedProperties properties;

  public E2eDataInitializer(
      IUserRepository userRepository,
      IDentistRepository dentistRepository,
      IPatientRepository patientRepository,
      IAddressRepository addressRepository,
      IAppointmentRepository appointmentRepository,
      PasswordEncoder passwordEncoder,
      E2eSeedProperties properties) {
    this.userRepository = userRepository;
    this.dentistRepository = dentistRepository;
    this.patientRepository = patientRepository;
    this.addressRepository = addressRepository;
    this.appointmentRepository = appointmentRepository;
    this.passwordEncoder = passwordEncoder;
    this.properties = properties;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (userRepository.findByEmail(properties.adminEmail()).isPresent()) {
      if (appointmentRepository.count() == 0) {
        Patient patient = patientRepository.findByEmail(properties.nonAdminEmail()).orElseThrow();
        Dentist dentist =
            dentistRepository.findByEmail("e2e.dentist@dentalclinic.test").orElseThrow();
        saveAppointment(patient, dentist);
      }
      return;
    }

    User admin = new User();
    copyUser(admin, "E2E Admin", properties.adminEmail(), properties.adminPassword(), Role.ADMIN);
    userRepository.save(admin);

    Dentist dentist = new Dentist();
    copyUser(
        dentist,
        "E2E Dentist",
        "e2e.dentist@dentalclinic.test",
        properties.nonAdminPassword(),
        Role.DENTIST);
    dentist.setRegistrationNumber(99001);
    dentistRepository.save(dentist);

    Address address = new Address();
    address.setStreet("E2E Street");
    address.setNumber(1);
    address.setLocation("Test City");
    address.setProvince("Test Province");
    addressRepository.save(address);

    Patient patient = new Patient();
    copyUser(
        patient,
        "E2E Patient",
        properties.nonAdminEmail(),
        properties.nonAdminPassword(),
        Role.PATIENT);
    patient.setCardIdentity(99001);
    patient.setAdmissionDate(LocalDate.of(2020, 1, 1));
    patient.setAddress(address);
    patientRepository.save(patient);

    saveAppointment(patient, dentist);
  }

  private void saveAppointment(Patient patient, Dentist dentist) {
    Appointment appointment = new Appointment();
    appointment.setPatient(patient);
    appointment.setDentist(dentist);
    appointment.setDate(E2eProfileBoundary.nextUtcWeekday(LocalDate.now(ZoneOffset.UTC)));
    appointment.setTime(LocalTime.of(10, 0));
    appointment.setDescription("E2E seeded appointment");
    appointment.setStatus(AppointmentStatus.SCHEDULED);
    appointmentRepository.save(appointment);
  }

  private void copyUser(User user, String firstName, String email, String password, Role role) {
    user.setFirstName(firstName);
    user.setLastName("User");
    user.setEmail(email);
    user.setPassword(passwordEncoder.encode(password));
    user.setRole(role);
  }
}
