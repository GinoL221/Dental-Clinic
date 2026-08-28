package com.dh.dentalClinicMVC.configuration;

import com.dh.dentalClinicMVC.entity.*;
import com.dh.dentalClinicMVC.repository.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Carga datos demo al iniciar la aplicación si la base está vacía. Solo activo con el perfil "dev"
 * y nunca si "prod" está activo. Idempotente: no inserta si ya existe el usuario admin.
 */
@Component
@Profile("dev & !prod")
public class DataInitializer implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

  private final IUserRepository userRepository;
  private final IDentistRepository dentistRepository;
  private final IPatientRepository patientRepository;
  private final IAddressRepository addressRepository;
  private final IAppointmentRepository appointmentRepository;
  private final ISpecialtyRepository specialtyRepository;
  private final PasswordEncoder passwordEncoder;

  public DataInitializer(
      IUserRepository userRepository,
      IDentistRepository dentistRepository,
      IPatientRepository patientRepository,
      IAddressRepository addressRepository,
      IAppointmentRepository appointmentRepository,
      ISpecialtyRepository specialtyRepository,
      PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.dentistRepository = dentistRepository;
    this.patientRepository = patientRepository;
    this.addressRepository = addressRepository;
    this.appointmentRepository = appointmentRepository;
    this.specialtyRepository = specialtyRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (userRepository.findByEmail("admin@dentalclinic.com").isPresent()) {
      log.info("DataInitializer: datos demo ya presentes, omitiendo seed.");
      return;
    }
    log.info("DataInitializer: insertando datos demo...");

    // ── Especialidades ────────────────────────────────────────────────────
    Specialty ortodoncia =
        saveSpecialty("Ortodoncia", "Corrección de la alineación dental y mandibular");
    Specialty endodoncia = saveSpecialty("Endodoncia", "Tratamiento del conducto radicular");
    Specialty cirugia = saveSpecialty("Cirugía Oral", "Extracciones complejas y cirugías bucales");
    Specialty estetica =
        saveSpecialty("Odontología Estética", "Blanqueamiento, carillas y coronas estéticas");
    Specialty periodoncia =
        saveSpecialty("Periodoncia", "Tratamiento de encías y tejidos de soporte");
    Specialty pediatrica =
        saveSpecialty("Odontología Pediátrica", "Atención dental especializada en niños");

    // ── Admin ─────────────────────────────────────────────────────────────
    User admin = new User();
    admin.setFirstName("Admin");
    admin.setLastName("Sistema");
    admin.setEmail("admin@dentalclinic.com");
    admin.setPassword(passwordEncoder.encode("admin123"));
    admin.setRole(Role.ADMIN);
    userRepository.save(admin);

    // ── Dentistas ─────────────────────────────────────────────────────────
    Dentist maria =
        saveDentist(
            "María",
            "González",
            "maria.gonzalez@dentalclinic.com",
            "maria123",
            12345,
            List.of(ortodoncia, estetica));
    Dentist carlos =
        saveDentist(
            "Carlos",
            "Rodríguez",
            "carlos.rodriguez@dentalclinic.com",
            "carlos123",
            23456,
            List.of(endodoncia, cirugia));
    Dentist ana =
        saveDentist(
            "Ana",
            "Martínez",
            "ana.martinez@dentalclinic.com",
            "ana123",
            34567,
            List.of(cirugia, periodoncia));
    Dentist luis =
        saveDentist(
            "Luis",
            "Fernández",
            "luis.fernandez@dentalclinic.com",
            "luis123",
            45678,
            List.of(estetica, pediatrica));

    // ── Pacientes ─────────────────────────────────────────────────────────
    Patient juan =
        savePatient(
            "Juan",
            "Pérez",
            "juan.perez@email.com",
            "juan123",
            12345678,
            "Av. Corrientes",
            1234,
            "CABA",
            "CABA",
            LocalDate.now().minusMonths(6));
    Patient mlopez =
        savePatient(
            "María",
            "López",
            "maria.lopez@email.com",
            "maria456",
            23456789,
            "San Martín",
            567,
            "San Isidro",
            "Buenos Aires",
            LocalDate.now().minusMonths(5));
    Patient cgarcia =
        savePatient(
            "Carlos",
            "García",
            "carlos.garcia@email.com",
            "carlos456",
            34567890,
            "Rivadavia",
            890,
            "Córdoba",
            "Córdoba",
            LocalDate.now().minusMonths(4));
    Patient ana2 =
        savePatient(
            "Ana",
            "Morales",
            "ana.morales@email.com",
            "ana456",
            45678901,
            "Belgrano",
            456,
            "Rosario",
            "Santa Fe",
            LocalDate.now().minusMonths(4));
    Patient pedro =
        savePatient(
            "Pedro",
            "Ruiz",
            "pedro.ruiz@email.com",
            "pedro789",
            56789012,
            "Mitre",
            789,
            "La Plata",
            "Buenos Aires",
            LocalDate.now().minusMonths(3));
    Patient laura =
        savePatient(
            "Laura",
            "Silva",
            "laura.silva@email.com",
            "laura789",
            67890123,
            "9 de Julio",
            321,
            "Mendoza",
            "Mendoza",
            LocalDate.now().minusMonths(3));
    Patient diego =
        savePatient(
            "Diego",
            "Torres",
            "diego.torres@email.com",
            "diego000",
            78901234,
            "Sarmiento",
            654,
            "CABA",
            "CABA",
            LocalDate.now().minusMonths(2));
    Patient sofia =
        savePatient(
            "Sofía",
            "Vega",
            "sofia.vega@email.com",
            "sofia000",
            89012345,
            "Maipú",
            987,
            "Mar del Plata",
            "Buenos Aires",
            LocalDate.now().minusMonths(2));
    Patient lucas =
        savePatient(
            "Lucas",
            "Herrera",
            "lucas.herrera@email.com",
            "lucas123",
            11223344,
            "Florida",
            200,
            "Vicente López",
            "Buenos Aires",
            LocalDate.now().minusMonths(1));
    Patient valeria =
        savePatient(
            "Valeria",
            "Castro",
            "valeria.castro@email.com",
            "vale456",
            55667788,
            "Lavalle",
            300,
            "CABA",
            "CABA",
            LocalDate.now().minusMonths(1));

    saveAppointments(
        Map.of(
            "juan", juan,
            "mlopez", mlopez,
            "cgarcia", cgarcia,
            "ana2", ana2,
            "pedro", pedro,
            "laura", laura,
            "diego", diego,
            "sofia", sofia,
            "lucas", lucas,
            "valeria", valeria),
        Map.of("maria", maria, "carlos", carlos, "ana", ana, "luis", luis));

    log.info(
        "DataInitializer: seed completado — {} usuarios, {} citas.",
        userRepository.count(),
        appointmentRepository.count());
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private Specialty saveSpecialty(String name, String description) {
    return specialtyRepository
        .findByName(name)
        .orElseGet(
            () -> {
              Specialty s = new Specialty();
              s.setName(name);
              s.setDescription(description);
              return specialtyRepository.save(s);
            });
  }

  private Dentist saveDentist(
      String firstName,
      String lastName,
      String email,
      String rawPassword,
      int regNumber,
      List<Specialty> specialties) {
    Dentist d = new Dentist();
    d.setFirstName(firstName);
    d.setLastName(lastName);
    d.setEmail(email);
    d.setPassword(passwordEncoder.encode(rawPassword));
    d.setRole(Role.DENTIST);
    d.setRegistrationNumber(regNumber);
    d.getSpecialties().addAll(specialties);
    return dentistRepository.save(d);
  }

  private Patient savePatient(
      String firstName,
      String lastName,
      String email,
      String rawPassword,
      int cardIdentity,
      String street,
      int number,
      String location,
      String province,
      LocalDate admissionDate) {
    Address address = new Address();
    address.setStreet(street);
    address.setNumber(number);
    address.setLocation(location);
    address.setProvince(province);
    addressRepository.save(address);

    Patient p = new Patient();
    p.setFirstName(firstName);
    p.setLastName(lastName);
    p.setEmail(email);
    p.setPassword(passwordEncoder.encode(rawPassword));
    p.setRole(Role.PATIENT);
    p.setCardIdentity(cardIdentity);
    p.setAdmissionDate(admissionDate);
    p.setAddress(address);
    return patientRepository.save(p);
  }

  private void saveAppointment(
      Patient patient,
      Dentist dentist,
      LocalDate date,
      String time,
      String description,
      AppointmentStatus status) {
    Appointment a = new Appointment();
    a.setPatient(patient);
    a.setDentist(dentist);
    a.setDate(date);
    a.setTime(LocalTime.parse(time));
    a.setDescription(description);
    a.setStatus(status);
    appointmentRepository.save(a);
  }

  private void saveAppointments(Map<String, Patient> patients, Map<String, Dentist> dentists) {
    for (DevAppointmentFixtures.AppointmentFixture fixture : DevAppointmentFixtures.CATALOG) {
      saveAppointment(
          patients.get(fixture.patientKey()),
          dentists.get(fixture.dentistKey()),
          LocalDate.now().plusDays(fixture.dayOffset()),
          fixture.time(),
          fixture.description(),
          fixture.status());
    }
  }
}
