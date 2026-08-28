package com.dh.dentalClinicMVC.service.impl;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class AppointmentSearchQueryTest {

  private static final AppointmentStatus STATUS = AppointmentStatus.COMPLETED;
  private static final LocalDate FROM_DATE = LocalDate.of(2026, 1, 10);
  private static final LocalDate TO_DATE = LocalDate.of(2026, 1, 20);
  private static final Pageable PAGEABLE = PageRequest.of(2, 7);
  private static final String PATIENT_ID = "101";
  private static final String PATIENT_NAME = "Alice Patient";
  private static final String DENTIST_ID = "202";
  private static final String DENTIST_NAME = "Dr. Smith";

  @Mock private IAppointmentRepository appointmentRepository;

  private AppointmentSearchQuery query;

  @BeforeEach
  void setUp() {
    query = new AppointmentSearchQuery(appointmentRepository);
  }

  @ParameterizedTest(name = "{0}")
  @MethodSource("routingCases")
  void selectsExpectedRepositoryMethod(
      String description, String patient, String dentist, Route route) {
    Page<Appointment> expected = new PageImpl<>(List.of());
    stub(route, expected);

    Page<Appointment> actual = query.find(patient, dentist, STATUS, FROM_DATE, TO_DATE, PAGEABLE);

    assertSame(expected, actual);
    verifySelectedRoute(route);
    verifyNoMoreInteractions(appointmentRepository);
  }

  private static Stream<Arguments> routingCases() {
    return Stream.of(
        Arguments.of(
            "patient ID + dentist ID", PATIENT_ID, DENTIST_ID, Route.PATIENT_ID_DENTIST_ID),
        Arguments.of(
            "patient ID + dentist name", PATIENT_ID, DENTIST_NAME, Route.PATIENT_ID_DENTIST_NAME),
        Arguments.of("patient ID + no dentist", PATIENT_ID, null, Route.PATIENT_ID),
        Arguments.of(
            "patient name + dentist ID", PATIENT_NAME, DENTIST_ID, Route.PATIENT_NAME_DENTIST_ID),
        Arguments.of(
            "patient name + dentist name",
            PATIENT_NAME,
            DENTIST_NAME,
            Route.PATIENT_NAME_DENTIST_NAME),
        Arguments.of("patient name + no dentist", PATIENT_NAME, "", Route.PATIENT_NAME),
        Arguments.of("no patient + dentist ID", null, DENTIST_ID, Route.DENTIST_ID),
        Arguments.of("no patient + dentist name", "", DENTIST_NAME, Route.DENTIST_NAME),
        Arguments.of("no patient + no dentist", "", "", Route.NONE));
  }

  private void stub(Route route, Page<Appointment> result) {
    switch (route) {
      case PATIENT_ID_DENTIST_ID ->
          when(appointmentRepository.searchAppointmentsByPatientIdAndDentistId(
                  101L, 202L, STATUS, FROM_DATE, TO_DATE, PAGEABLE))
              .thenReturn(result);
      case PATIENT_ID_DENTIST_NAME ->
          when(appointmentRepository.searchAppointmentsByPatientIdAndDentistName(
                  101L, DENTIST_NAME, STATUS, FROM_DATE, TO_DATE, PAGEABLE))
              .thenReturn(result);
      case PATIENT_ID ->
          when(appointmentRepository.searchAppointmentsByPatientId(
                  101L, null, STATUS, FROM_DATE, TO_DATE, PAGEABLE))
              .thenReturn(result);
      case PATIENT_NAME_DENTIST_ID ->
          when(appointmentRepository.searchAppointmentsByPatientNameAndDentistId(
                  PATIENT_NAME, 202L, STATUS, FROM_DATE, TO_DATE, PAGEABLE))
              .thenReturn(result);
      case PATIENT_NAME_DENTIST_NAME ->
          when(appointmentRepository.searchAppointmentsByPatientNameAndDentistName(
                  PATIENT_NAME, DENTIST_NAME, STATUS, FROM_DATE, TO_DATE, PAGEABLE))
              .thenReturn(result);
      case PATIENT_NAME ->
          when(appointmentRepository.searchAppointmentsByPatientName(
                  PATIENT_NAME, null, STATUS, FROM_DATE, TO_DATE, PAGEABLE))
              .thenReturn(result);
      case DENTIST_ID ->
          when(appointmentRepository.searchAppointmentsByDentistId(
                  202L, null, STATUS, FROM_DATE, TO_DATE, PAGEABLE))
              .thenReturn(result);
      case DENTIST_NAME ->
          when(appointmentRepository.searchAppointmentsByDentistName(
                  DENTIST_NAME, null, STATUS, FROM_DATE, TO_DATE, PAGEABLE))
              .thenReturn(result);
      case NONE ->
          when(appointmentRepository.searchAppointments(
                  null, null, STATUS, FROM_DATE, TO_DATE, PAGEABLE))
              .thenReturn(result);
    }
  }

  private void verifySelectedRoute(Route route) {
    switch (route) {
      case PATIENT_ID_DENTIST_ID ->
          verify(appointmentRepository)
              .searchAppointmentsByPatientIdAndDentistId(
                  101L, 202L, STATUS, FROM_DATE, TO_DATE, PAGEABLE);
      case PATIENT_ID_DENTIST_NAME ->
          verify(appointmentRepository)
              .searchAppointmentsByPatientIdAndDentistName(
                  101L, DENTIST_NAME, STATUS, FROM_DATE, TO_DATE, PAGEABLE);
      case PATIENT_ID ->
          verify(appointmentRepository)
              .searchAppointmentsByPatientId(101L, null, STATUS, FROM_DATE, TO_DATE, PAGEABLE);
      case PATIENT_NAME_DENTIST_ID ->
          verify(appointmentRepository)
              .searchAppointmentsByPatientNameAndDentistId(
                  PATIENT_NAME, 202L, STATUS, FROM_DATE, TO_DATE, PAGEABLE);
      case PATIENT_NAME_DENTIST_NAME ->
          verify(appointmentRepository)
              .searchAppointmentsByPatientNameAndDentistName(
                  PATIENT_NAME, DENTIST_NAME, STATUS, FROM_DATE, TO_DATE, PAGEABLE);
      case PATIENT_NAME ->
          verify(appointmentRepository)
              .searchAppointmentsByPatientName(
                  PATIENT_NAME, null, STATUS, FROM_DATE, TO_DATE, PAGEABLE);
      case DENTIST_ID ->
          verify(appointmentRepository)
              .searchAppointmentsByDentistId(202L, null, STATUS, FROM_DATE, TO_DATE, PAGEABLE);
      case DENTIST_NAME ->
          verify(appointmentRepository)
              .searchAppointmentsByDentistName(
                  DENTIST_NAME, null, STATUS, FROM_DATE, TO_DATE, PAGEABLE);
      case NONE ->
          verify(appointmentRepository)
              .searchAppointments(null, null, STATUS, FROM_DATE, TO_DATE, PAGEABLE);
    }
  }

  private enum Route {
    PATIENT_ID_DENTIST_ID,
    PATIENT_ID_DENTIST_NAME,
    PATIENT_ID,
    PATIENT_NAME_DENTIST_ID,
    PATIENT_NAME_DENTIST_NAME,
    PATIENT_NAME,
    DENTIST_ID,
    DENTIST_NAME,
    NONE
  }
}
