package com.dh.dentalClinicMVC.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.service.impl.AppointmentServiceImpl;
import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;
import org.springframework.cache.annotation.CacheEvict;

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

  private void assertEvictsDashboardSnapshotCache(Method method) {
    CacheEvict cacheEvict = method.getAnnotation(CacheEvict.class);

    assertNotNull(cacheEvict, method.getName() + " is missing @CacheEvict");
    assertTrue(cacheEvict.allEntries());
    assertEquals("dashboardSnapshot", cacheEvict.cacheNames()[0]);
  }
}
