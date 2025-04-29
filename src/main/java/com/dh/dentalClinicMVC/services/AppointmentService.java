package com.dh.dentalClinicMVC.services;

import com.dh.dentalClinicMVC.dao.AppointmentDaoList;
import com.dh.dentalClinicMVC.dao.IDao;
import com.dh.dentalClinicMVC.model.Appointment;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppointmentService {

    private IDao<Appointment> appointmentIDao;

    public AppointmentService(IDao<Appointment> appointmentIDao) {
        this.appointmentIDao = appointmentIDao;
    }

    public Appointment save(Appointment appointment) {
        return appointmentIDao.save(appointment);
    }

    public void update(Appointment appointment) {
        appointmentIDao.update(appointment);
    }

    public Appointment findById(Integer id) {
        return appointmentIDao.findById(id);
    }

    public List<Appointment> findAll() {
        return appointmentIDao.findAll();
    }
}
