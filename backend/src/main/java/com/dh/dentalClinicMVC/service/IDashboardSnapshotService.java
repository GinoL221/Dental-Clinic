package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.dto.DashboardSnapshotDTO;
import java.time.LocalDate;
import org.jspecify.annotations.Nullable;

public interface IDashboardSnapshotService {

  DashboardSnapshotDTO getDashboardSnapshot(
      @Nullable LocalDate from, @Nullable LocalDate to, @Nullable Long dentistId);

  default DashboardSnapshotDTO getDashboardSnapshot() {
    return getDashboardSnapshot(null, null, null);
  }
}
