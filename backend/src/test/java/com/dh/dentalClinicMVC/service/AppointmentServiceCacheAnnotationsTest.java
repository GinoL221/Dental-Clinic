package com.dh.dentalClinicMVC.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.dh.dentalClinicMVC.authentication.AuthenticationService;
import com.dh.dentalClinicMVC.authentication.RegisterRequest;
import com.dh.dentalClinicMVC.configuration.CacheConfig;
import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.dto.DentistRequestDTO;
import com.dh.dentalClinicMVC.dto.PatientRequestDTO;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.service.impl.AppointmentServiceImpl;
import com.dh.dentalClinicMVC.service.impl.DentistServiceImpl;
import com.dh.dentalClinicMVC.service.impl.PatientServiceImpl;
import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.core.Ordered;

class AppointmentServiceCacheAnnotationsTest {

  @Test
  void shouldEvictDashboardSnapshotCacheOnStatusChangeMethod() throws NoSuchMethodException {
    assertEvictsDashboardSnapshotCache(
        AppointmentServiceImpl.class.getMethod(
            "updateStatus", Long.class, AppointmentStatus.class));
  }

  @Test
  void shouldEvictDashboardSnapshotCacheOnSaveMethod() throws NoSuchMethodException {
    assertEvictsDashboardSnapshotCache(
        AppointmentServiceImpl.class.getMethod("save", AppointmentDTO.class));
  }

  @Test
  void shouldEvictDashboardSnapshotCacheOnUpdateMethod() throws NoSuchMethodException {
    assertEvictsDashboardSnapshotCache(
        AppointmentServiceImpl.class.getMethod("update", AppointmentDTO.class));
  }

  @Test
  void shouldEvictDashboardSnapshotCacheOnDeleteMethod() throws NoSuchMethodException {
    assertEvictsDashboardSnapshotCache(
        AppointmentServiceImpl.class.getMethod("delete", Long.class));
  }

  @Test
  void shouldEvictDashboardSnapshotCacheOnPatientMutations() throws NoSuchMethodException {
    assertEvictsDashboardSnapshotCache(PatientServiceImpl.class.getMethod("save", Patient.class));
    assertEvictsDashboardSnapshotCache(
        PatientServiceImpl.class.getMethod("save", PatientRequestDTO.class));
    assertEvictsDashboardSnapshotCache(PatientServiceImpl.class.getMethod("update", Patient.class));
    assertEvictsDashboardSnapshotCache(
        PatientServiceImpl.class.getMethod("update", Long.class, PatientRequestDTO.class));
    assertEvictsDashboardSnapshotCache(PatientServiceImpl.class.getMethod("delete", Long.class));
  }

  @Test
  void shouldEvictDashboardSnapshotCacheOnDentistMutations() throws NoSuchMethodException {
    assertEvictsDashboardSnapshotCache(DentistServiceImpl.class.getMethod("save", Dentist.class));
    assertEvictsDashboardSnapshotCache(
        DentistServiceImpl.class.getMethod("save", DentistRequestDTO.class));
    assertEvictsDashboardSnapshotCache(DentistServiceImpl.class.getMethod("update", Dentist.class));
    assertEvictsDashboardSnapshotCache(
        DentistServiceImpl.class.getMethod("update", Long.class, DentistRequestDTO.class));
    assertEvictsDashboardSnapshotCache(DentistServiceImpl.class.getMethod("delete", Long.class));
  }

  @Test
  void shouldEvictDashboardSnapshotCacheOnAuthenticationRegister() throws NoSuchMethodException {
    assertEvictsDashboardSnapshotCache(
        AuthenticationService.class.getMethod("register", RegisterRequest.class));
  }

  @Test
  void cacheAdvisorShouldRunOutsideTransactionAdvisor() {
    EnableCaching enableCaching = CacheConfig.class.getAnnotation(EnableCaching.class);

    assertNotNull(enableCaching, "CacheConfig must declare @EnableCaching");
    assertTrue(
        enableCaching.order() < Ordered.LOWEST_PRECEDENCE,
        "@EnableCaching order must be lower than Ordered.LOWEST_PRECEDENCE so @CacheEvict runs outside @Transactional (after commit)");
  }

  private void assertEvictsDashboardSnapshotCache(Method method) {
    CacheEvict cacheEvict = method.getAnnotation(CacheEvict.class);

    assertNotNull(cacheEvict, method.getName() + " is missing @CacheEvict");
    assertTrue(cacheEvict.allEntries());
    assertEquals("dashboardSnapshot", cacheEvict.cacheNames()[0]);
  }
}
