package com.dh.dentalClinicMVC.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.dh.dentalClinicMVC.dto.AddressRequestDTO;
import com.dh.dentalClinicMVC.dto.PatientRequestDTO;
import com.dh.dentalClinicMVC.dto.PatientResponseDTO;
import com.dh.dentalClinicMVC.exception.DuplicateResourceException;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

/**
 * Runtime verification that {@code @CacheEvict("dashboardSnapshot")} executes after transaction
 * commit and does NOT evict when the enclosing {@code @Transactional} method rolls back.
 *
 * <p>Intentionally omits {@code @Transactional} at class/method level so Spring transactions
 * actually commit and roll back.
 */
@SpringBootTest
class DashboardCacheEvictionTransactionTest {

  @Autowired private IDashboardSnapshotService dashboardSnapshotService;
  @Autowired private IPatientService patientService;
  @Autowired private IPatientRepository patientRepository;
  @Autowired private CacheManager cacheManager;

  private static final String DEFAULT_CACHE_KEY = "default";

  private final List<Long> createdPatientIds = new ArrayList<>();

  @BeforeEach
  void clearCacheBefore() {
    Cache cache = cacheManager.getCache("dashboardSnapshot");
    if (cache != null) {
      cache.clear();
    }
  }

  @AfterEach
  void cleanup() {
    for (Long id : createdPatientIds) {
      patientRepository.deleteById(id);
    }
    createdPatientIds.clear();
    Cache cache = cacheManager.getCache("dashboardSnapshot");
    if (cache != null) {
      cache.clear();
    }
  }

  @Test
  @DisplayName(
      "dashboardSnapshot cache is evicted on commit and preserved when transaction rolls back")
  void cacheEvictsOnCommitAndStaysPopulatedOnRollback() {
    Cache cache = cacheManager.getCache("dashboardSnapshot");
    assertNotNull(cache, "dashboardSnapshot cache must be configured");

    // 1. Populate cache
    dashboardSnapshotService.getDashboardSnapshot(null, null, null);
    assertNotNull(cache.get(DEFAULT_CACHE_KEY), "Cache must be populated before mutation");

    // 2. Successful save commits -> cache must be evicted
    PatientRequestDTO validDto =
        new PatientRequestDTO(
            "Cache",
            "Tester",
            "cache-tx-test@example.com",
            99887766,
            LocalDate.now(),
            new AddressRequestDTO("Calle Falsa", 123, "Centro", "Cordoba"),
            null);

    PatientResponseDTO saved = patientService.save(validDto);
    assertNotNull(saved);
    assertNotNull(saved.getId());
    createdPatientIds.add(saved.getId());

    assertNull(
        cache.get(DEFAULT_CACHE_KEY),
        "dashboardSnapshot cache must be evicted after transaction commits");

    // 3. Re-populate cache
    dashboardSnapshotService.getDashboardSnapshot(null, null, null);
    assertNotNull(cache.get(DEFAULT_CACHE_KEY), "Cache must be re-populated before rollback test");

    // 4. Duplicate save throws DuplicateResourceException and rolls back -> cache must NOT evict
    PatientRequestDTO duplicateEmailDto =
        new PatientRequestDTO(
            "Cache",
            "Duplicate",
            "cache-tx-test@example.com",
            99887767,
            LocalDate.now(),
            new AddressRequestDTO("Calle Falsa", 124, "Centro", "Cordoba"),
            null);

    assertThrows(DuplicateResourceException.class, () -> patientService.save(duplicateEmailDto));

    assertNotNull(
        cache.get(DEFAULT_CACHE_KEY),
        "dashboardSnapshot cache must NOT be evicted when transaction rolls back");
  }
}
