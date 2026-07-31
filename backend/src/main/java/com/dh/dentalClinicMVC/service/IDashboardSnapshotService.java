package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.dto.DashboardSnapshotDTO;
import java.time.LocalDate;

public interface IDashboardSnapshotService {

  DashboardSnapshotDTO getDashboardSnapshot(LocalDate from, LocalDate to, Long dentistId);

  default DashboardSnapshotDTO getDashboardSnapshot() {
    return getDashboardSnapshot(null, null, null);
  }
}
