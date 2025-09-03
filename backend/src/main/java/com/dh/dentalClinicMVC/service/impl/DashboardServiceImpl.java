package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.dto.DashboardStatsDTO;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.service.IDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;

@Service
public class DashboardServiceImpl implements IDashboardService {

    private final IAppointmentRepository appointmentRepository;
    private final IDentistRepository dentistRepository;
    private final IPatientRepository patientRepository;

    @Autowired
    public DashboardServiceImpl(IAppointmentRepository appointmentRepository,
                               IDentistRepository dentistRepository,
                               IPatientRepository patientRepository) {
        this.appointmentRepository = appointmentRepository;
        this.dentistRepository = dentistRepository;
        this.patientRepository = patientRepository;
    }

    @Override
    public DashboardStatsDTO getDashboardStats() {
    // Implementación básica para compatibilidad
    DashboardStatsDTO stats = new DashboardStatsDTO();
    stats.setTotalAppointments(appointmentRepository.count());
    stats.setTotalDentists(dentistRepository.count());
    stats.setTotalPatients(patientRepository.count());
    return stats;
    }

    @Override
    public Map<String, Object> getDashboardStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // Contadores principales
        long totalAppointments = appointmentRepository.count();
        long totalDentists = dentistRepository.count();
        long totalPatients = patientRepository.count();
        
        stats.put("totalAppointments", totalAppointments);
        stats.put("totalDentists", totalDentists);
        stats.put("totalPatients", totalPatients);
        
        // Citas de hoy
        long todayAppointments = appointmentRepository.countByDate(LocalDate.now());
        stats.put("todayAppointments", todayAppointments);
        
        // Fecha de última actualización
        stats.put("lastUpdated", LocalDate.now().toString());
        
        return stats;
    }

    @Override
    public Map<String, Object> getAppointmentsByMonth() {
        Map<String, Object> data = new HashMap<>();
        
        // Obtener datos de los últimos 6 meses
        List<String> months = new ArrayList<>();
        List<Long> appointmentCounts = new ArrayList<>();
        
        LocalDate currentDate = LocalDate.now();
        
        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = currentDate.minusMonths(i);
            String monthName = monthDate.getMonth().getDisplayName(TextStyle.SHORT, Locale.forLanguageTag("es"));
            
            // Calcular primer y último día del mes
            LocalDate firstDay = monthDate.withDayOfMonth(1);
            LocalDate lastDay = monthDate.withDayOfMonth(monthDate.lengthOfMonth());
            
            // Contar citas en ese mes
            long count = appointmentRepository.countByDateBetween(firstDay, lastDay);
            
            months.add(monthName + " " + monthDate.getYear());
            appointmentCounts.add(count);
        }
        
        data.put("months", months);
        data.put("appointmentCounts", appointmentCounts);
        
        return data;
    }

    @Override
    public Map<String, Object> getUpcomingAppointments() {
        Map<String, Object> data = new HashMap<>();
        
        LocalDate today = LocalDate.now();
        
        // Obtener citas de hoy y próximos días
        List<Object[]> upcomingAppointments = appointmentRepository.findUpcomingAppointmentsWithDetails(today);
        
        List<Map<String, String>> appointmentsList = new ArrayList<>();
        
        for (Object[] appointment : upcomingAppointments) {
            Map<String, String> appointmentInfo = new HashMap<>();
            appointmentInfo.put("id", appointment[0].toString());
            appointmentInfo.put("time", appointment[1].toString());
            appointmentInfo.put("patientName", appointment[2].toString());
            appointmentInfo.put("dentistName", appointment[3].toString());
            appointmentInfo.put("date", appointment[4].toString());
            
            appointmentsList.add(appointmentInfo);
        }
        
        data.put("upcomingAppointments", appointmentsList);
        data.put("count", appointmentsList.size());
        
        return data;
    }
}
