package com.dh.dentalClinicMVC.configuration;

import com.dh.dentalClinicMVC.entity.*;
import com.dh.dentalClinicMVC.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Carga datos demo al iniciar la aplicación si la base está vacía.
 * Solo activo en los perfiles "prod" y "dev".
 * Idempotente: no inserta si ya existe el usuario admin.
 */
@Component
@Profile({"prod", "dev"})
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final IUserRepository userRepository;
    private final IDentistRepository dentistRepository;
    private final IPatientRepository patientRepository;
    private final IAddressRepository addressRepository;
    private final IAppointmentRepository appointmentRepository;
    private final ISpecialtyRepository specialtyRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(IUserRepository userRepository,
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
        Specialty ortodoncia    = saveSpecialty("Ortodoncia",       "Corrección de la alineación dental y mandibular");
        Specialty endodoncia    = saveSpecialty("Endodoncia",       "Tratamiento del conducto radicular");
        Specialty cirugia       = saveSpecialty("Cirugía Oral",     "Extracciones complejas y cirugías bucales");
        Specialty estetica      = saveSpecialty("Odontología Estética", "Blanqueamiento, carillas y coronas estéticas");
        Specialty periodoncia   = saveSpecialty("Periodoncia",      "Tratamiento de encías y tejidos de soporte");
        Specialty pediatrica    = saveSpecialty("Odontología Pediátrica", "Atención dental especializada en niños");

        // ── Admin ─────────────────────────────────────────────────────────────
        User admin = new User();
        admin.setFirstName("Admin");
        admin.setLastName("Sistema");
        admin.setEmail("admin@dentalclinic.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);

        // ── Dentistas ─────────────────────────────────────────────────────────
        Dentist maria   = saveDentist("María",   "González",  "maria.gonzalez@dentalclinic.com",   "maria123",   12345, List.of(ortodoncia, estetica));
        Dentist carlos  = saveDentist("Carlos",  "Rodríguez", "carlos.rodriguez@dentalclinic.com",  "carlos123",  23456, List.of(endodoncia, cirugia));
        Dentist ana     = saveDentist("Ana",     "Martínez",  "ana.martinez@dentalclinic.com",      "ana123",     34567, List.of(cirugia, periodoncia));
        Dentist luis    = saveDentist("Luis",    "Fernández", "luis.fernandez@dentalclinic.com",    "luis123",    45678, List.of(estetica, pediatrica));

        // ── Pacientes ─────────────────────────────────────────────────────────
        Patient juan    = savePatient("Juan",    "Pérez",    "juan.perez@email.com",    "juan123",   12345678, "Av. Corrientes",  1234, "CABA",          "CABA",          LocalDate.now().minusMonths(6));
        Patient mlopez  = savePatient("María",   "López",    "maria.lopez@email.com",   "maria456",  23456789, "San Martín",       567, "San Isidro",    "Buenos Aires",  LocalDate.now().minusMonths(5));
        Patient cgarcia = savePatient("Carlos",  "García",   "carlos.garcia@email.com", "carlos456", 34567890, "Rivadavia",        890, "Córdoba",       "Córdoba",       LocalDate.now().minusMonths(4));
        Patient ana2    = savePatient("Ana",     "Morales",  "ana.morales@email.com",   "ana456",    45678901, "Belgrano",         456, "Rosario",       "Santa Fe",      LocalDate.now().minusMonths(4));
        Patient pedro   = savePatient("Pedro",   "Ruiz",     "pedro.ruiz@email.com",    "pedro789",  56789012, "Mitre",            789, "La Plata",      "Buenos Aires",  LocalDate.now().minusMonths(3));
        Patient laura   = savePatient("Laura",   "Silva",    "laura.silva@email.com",   "laura789",  67890123, "9 de Julio",       321, "Mendoza",       "Mendoza",       LocalDate.now().minusMonths(3));
        Patient diego   = savePatient("Diego",   "Torres",   "diego.torres@email.com",  "diego000",  78901234, "Sarmiento",        654, "CABA",          "CABA",          LocalDate.now().minusMonths(2));
        Patient sofia   = savePatient("Sofía",   "Vega",     "sofia.vega@email.com",    "sofia000",  89012345, "Maipú",            987, "Mar del Plata", "Buenos Aires",  LocalDate.now().minusMonths(2));
        Patient lucas   = savePatient("Lucas",   "Herrera",  "lucas.herrera@email.com", "lucas123",  11223344, "Florida",          200, "Vicente López", "Buenos Aires",  LocalDate.now().minusMonths(1));
        Patient valeria = savePatient("Valeria", "Castro",   "valeria.castro@email.com","vale456",   55667788, "Lavalle",          300, "CABA",          "CABA",          LocalDate.now().minusMonths(1));

        // ── Citas COMPLETED (pasado) ───────────────────────────────────────────
        saveAppointment(juan,    maria,  LocalDate.now().minusDays(85), "09:00", "Control de rutina y limpieza dental",              AppointmentStatus.COMPLETED);
        saveAppointment(mlopez,  carlos, LocalDate.now().minusDays(80), "10:30", "Tratamiento de endodoncia — molar superior",       AppointmentStatus.COMPLETED);
        saveAppointment(cgarcia, ana,    LocalDate.now().minusDays(75), "14:00", "Extracción de muela del juicio",                   AppointmentStatus.COMPLETED);
        saveAppointment(ana2,    maria,  LocalDate.now().minusDays(70), "11:00", "Colocación de brackets ortodóncicos",              AppointmentStatus.COMPLETED);
        saveAppointment(pedro,   luis,   LocalDate.now().minusDays(65), "15:30", "Empaste de caries en premolar",                    AppointmentStatus.COMPLETED);
        saveAppointment(laura,   carlos, LocalDate.now().minusDays(58), "09:30", "Segunda sesión de endodoncia",                     AppointmentStatus.COMPLETED);
        saveAppointment(diego,   ana,    LocalDate.now().minusDays(52), "14:00", "Control post extracción — cicatrización normal",   AppointmentStatus.COMPLETED);
        saveAppointment(sofia,   luis,   LocalDate.now().minusDays(47), "16:00", "Blanqueamiento dental — primera sesión",           AppointmentStatus.COMPLETED);
        saveAppointment(juan,    carlos, LocalDate.now().minusDays(42), "10:00", "Tratamiento de conducto — premolar inferior",      AppointmentStatus.COMPLETED);
        saveAppointment(mlopez,  maria,  LocalDate.now().minusDays(38), "11:30", "Ajuste de ortodoncia mensual",                     AppointmentStatus.COMPLETED);
        saveAppointment(lucas,   ana,    LocalDate.now().minusDays(32), "09:00", "Evaluación para corona dental",                    AppointmentStatus.COMPLETED);
        saveAppointment(valeria, luis,   LocalDate.now().minusDays(28), "15:00", "Limpieza dental semestral y fluorización",         AppointmentStatus.COMPLETED);
        saveAppointment(pedro,   maria,  LocalDate.now().minusDays(22), "10:30", "Revisión de brackets — ajuste de arco",            AppointmentStatus.COMPLETED);
        saveAppointment(cgarcia, carlos, LocalDate.now().minusDays(17), "14:30", "Control de endodoncia — sellado definitivo",       AppointmentStatus.COMPLETED);
        saveAppointment(ana2,    ana,    LocalDate.now().minusDays(10), "09:00", "Limpieza profunda y tratamiento de encías",        AppointmentStatus.COMPLETED);

        // ── Citas CANCELLED (pasado) ───────────────────────────────────────────
        saveAppointment(sofia,   maria,  LocalDate.now().minusDays(60), "16:00", "Consulta ortodoncia — paciente canceló",           AppointmentStatus.CANCELLED);
        saveAppointment(diego,   carlos, LocalDate.now().minusDays(45), "11:00", "Endodoncia — reprogramada por el paciente",        AppointmentStatus.CANCELLED);
        saveAppointment(lucas,   luis,   LocalDate.now().minusDays(35), "13:00", "Blanqueamiento — cancelado por el dentista",       AppointmentStatus.CANCELLED);
        saveAppointment(valeria, ana,    LocalDate.now().minusDays(25), "10:00", "Control de encías — paciente ausente",             AppointmentStatus.CANCELLED);
        saveAppointment(juan,    luis,   LocalDate.now().minusDays(12), "15:30", "Revisión estética — cancelada por el paciente",    AppointmentStatus.CANCELLED);

        // ── Citas IN_PROGRESS (hoy) ────────────────────────────────────────────
        saveAppointment(mlopez,  maria,  LocalDate.now(), "09:00", "Sesión de ortodoncia — ajuste trimestral en curso",  AppointmentStatus.IN_PROGRESS);
        saveAppointment(pedro,   carlos, LocalDate.now(), "11:00", "Tratamiento de conducto — segunda sesión en curso",  AppointmentStatus.IN_PROGRESS);
        saveAppointment(laura,   ana,    LocalDate.now(), "14:30", "Cirugía de tejido blando — en progreso",             AppointmentStatus.IN_PROGRESS);

        // ── Citas SCHEDULED (futuro) ───────────────────────────────────────────
        saveAppointment(juan,    maria,  LocalDate.now().plusDays(2),  "09:00", "Control de ortodoncia — revisión mensual",          AppointmentStatus.SCHEDULED);
        saveAppointment(cgarcia, carlos, LocalDate.now().plusDays(3),  "10:30", "Evaluación para implante dental",                   AppointmentStatus.SCHEDULED);
        saveAppointment(sofia,   ana,    LocalDate.now().plusDays(4),  "14:00", "Tratamiento periodontal — seguimiento",             AppointmentStatus.SCHEDULED);
        saveAppointment(valeria, luis,   LocalDate.now().plusDays(5),  "11:00", "Segunda sesión de blanqueamiento",                  AppointmentStatus.SCHEDULED);
        saveAppointment(diego,   maria,  LocalDate.now().plusDays(7),  "15:30", "Colocación de retenedor post ortodoncia",           AppointmentStatus.SCHEDULED);
        saveAppointment(lucas,   carlos, LocalDate.now().plusDays(8),  "09:30", "Extracción de tercer molar — turno programado",     AppointmentStatus.SCHEDULED);
        saveAppointment(ana2,    luis,   LocalDate.now().plusDays(10), "16:00", "Consulta pediátrica para hijo del paciente",        AppointmentStatus.SCHEDULED);
        saveAppointment(mlopez,  ana,    LocalDate.now().plusDays(11), "10:00", "Control de encías — revisión trimestral",           AppointmentStatus.SCHEDULED);
        saveAppointment(pedro,   maria,  LocalDate.now().plusDays(12), "11:30", "Ajuste de arco ortodóncico",                        AppointmentStatus.SCHEDULED);
        saveAppointment(laura,   carlos, LocalDate.now().plusDays(14), "14:00", "Tratamiento de endodoncia — primera sesión",        AppointmentStatus.SCHEDULED);
        saveAppointment(juan,    luis,   LocalDate.now().plusDays(15), "09:00", "Carillas de porcelana — consulta inicial",          AppointmentStatus.SCHEDULED);
        saveAppointment(valeria, maria,  LocalDate.now().plusDays(18), "15:00", "Revisión general y plan de tratamiento",            AppointmentStatus.SCHEDULED);

        log.info("DataInitializer: seed completado — {} usuarios, {} citas.",
                userRepository.count(), appointmentRepository.count());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Specialty saveSpecialty(String name, String description) {
        return specialtyRepository.findByName(name).orElseGet(() -> {
            Specialty s = new Specialty();
            s.setName(name);
            s.setDescription(description);
            return specialtyRepository.save(s);
        });
    }

    private Dentist saveDentist(String firstName, String lastName, String email,
                                String rawPassword, int regNumber, List<Specialty> specialties) {
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

    private Patient savePatient(String firstName, String lastName, String email,
                                String rawPassword, int cardIdentity,
                                String street, int number, String location, String province,
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

    private void saveAppointment(Patient patient, Dentist dentist,
                                 LocalDate date, String time,
                                 String description, AppointmentStatus status) {
        Appointment a = new Appointment();
        a.setPatient(patient);
        a.setDentist(dentist);
        a.setDate(date);
        a.setTime(LocalTime.parse(time));
        a.setDescription(description);
        a.setStatus(status);
        appointmentRepository.save(a);
    }
}
