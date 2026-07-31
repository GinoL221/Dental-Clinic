package com.dh.dentalClinicMVC.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

/**
 * Runtime guard for the condition-gated {@code @Cacheable} on {@code
 * DashboardSnapshotService#getDashboardSnapshot(LocalDate, LocalDate, Long)}: an unparameterized
 * request must be cached (one delegate invocation for two calls), while any filtered request must
 * never read from or write to the cache (one delegate invocation per call, always).
 *
 * <p>This is a full Spring context test on purpose: only the real caching AOP proxy can prove the
 * {@code condition} SpEL actually gates the cache — a plain unit test calling the class directly
 * would bypass the proxy entirely and prove nothing.
 */
@SpringBootTest
class DashboardSnapshotCacheBehaviourTest {

  @Autowired private IDashboardSnapshotService dashboardSnapshotService;

  @MockBean private IDashboardService dashboardService;

  @Test
  void shouldCacheTheDefaultUnparameterizedRequest() {
    stubDelegate();

    dashboardSnapshotService.getDashboardSnapshot(null, null, null);
    dashboardSnapshotService.getDashboardSnapshot(null, null, null);

    verify(dashboardService, times(1)).getDashboardStatistics(null, null, null);
  }

  @Test
  void shouldNeverCacheAFilteredRequestRegardlessOfWhichParamIsSet() {
    stubDelegate();

    LocalDate from = LocalDate.now().minusMonths(1);
    LocalDate to = LocalDate.now();

    dashboardSnapshotService.getDashboardSnapshot(from, to, 7L);
    dashboardSnapshotService.getDashboardSnapshot(from, to, 7L);

    verify(dashboardService, times(2)).getDashboardStatistics(from, to, 7L);
  }

  private void stubDelegate() {
    Map<String, Object> stats = new HashMap<>();
    stats.put("totalAppointments", 1L);
    stats.put("totalDentists", 1L);
    stats.put("totalPatients", 1L);
    stats.put("todayAppointments", 1L);

    when(dashboardService.getDashboardStatistics(any(), any(), any())).thenReturn(stats);
    when(dashboardService.getAppointmentsByMonth(any(), any(), any())).thenReturn(new HashMap<>());
    when(dashboardService.getUpcomingAppointments(any(), any(), any())).thenReturn(new HashMap<>());
    when(dashboardService.getAppointmentsByStatus(any(), any(), any())).thenReturn(List.of());
    when(dashboardService.getAppointmentsByDentist(any(), any(), any())).thenReturn(List.of());
  }
}
