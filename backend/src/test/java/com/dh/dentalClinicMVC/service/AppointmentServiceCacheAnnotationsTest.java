package com.dh.dentalClinicMVC.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.service.impl.AppointmentServiceImpl;
import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;
import org.springframework.cache.annotation.CacheEvict;

class AppointmentServiceCacheAnnotationsTest {

  @Test
  void shouldEvictDashboardSnapshotCacheOnStatusChangeMethod() throws NoSuchMethodException {
    Method updateStatusMethod =
        AppointmentServiceImpl.class.getMethod("updateStatus", Long.class, AppointmentStatus.class);

    CacheEvict cacheEvict = updateStatusMethod.getAnnotation(CacheEvict.class);

    assertNotNull(cacheEvict);
    assertTrue(cacheEvict.allEntries());
    assertEquals("dashboardSnapshot", cacheEvict.cacheNames()[0]);
  }
}
