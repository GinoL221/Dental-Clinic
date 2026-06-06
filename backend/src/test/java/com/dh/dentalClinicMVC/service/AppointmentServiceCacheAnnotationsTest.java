package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.service.impl.AppointmentServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.cache.annotation.CacheEvict;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AppointmentServiceCacheAnnotationsTest {

    @Test
    void shouldEvictDashboardSnapshotCacheOnStatusChangeMethod() throws NoSuchMethodException {
        Method updateStatusMethod = AppointmentServiceImpl.class.getMethod(
                "updateStatus",
                Long.class,
                AppointmentStatus.class
        );

        CacheEvict cacheEvict = updateStatusMethod.getAnnotation(CacheEvict.class);

        assertNotNull(cacheEvict);
        assertTrue(cacheEvict.allEntries());
        assertEquals("dashboardSnapshot", cacheEvict.cacheNames()[0]);
    }
}
