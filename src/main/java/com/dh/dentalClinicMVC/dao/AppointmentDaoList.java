package com.dh.dentalClinicMVC.dao;

import com.dh.dentalClinicMVC.model.Appointment;
import org.hibernate.annotations.Comment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class AppointmentDaoList implements IDao<Appointment> {

    private List<Appointment> appointments;

    public AppointmentDaoList() {
        appointments = new ArrayList<>();
    }

    @Override
    public Appointment save(Appointment appointment) {
        // Guardamos en la lista el turno recibido por parametro
        appointments.add(appointment);
        return appointment;
    }

    @Override
    public Appointment findById(Integer id) {
        Appointment appointmentToLookFor = null;
        // Recorremos la lista de turnos
        for (Appointment a : appointments) {
            // Si el ID del turno coincide con el ID recibido por parametro lo retorna
            if (a.getId() == (id)) {
                appointmentToLookFor = a;
                return appointmentToLookFor;
            }
        }
        return appointmentToLookFor;
    }

    @Override
    public void update(Appointment appointment) {

    }

    @Override
    public void delete(Integer id) {

    }

    @Override
    public List<Appointment> findAll() {
        return appointments;
    }

    @Override
    public Appointment findByString(String value) {
        return null;
    }
}
