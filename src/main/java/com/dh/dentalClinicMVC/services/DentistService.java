package com.dh.dentalClinicMVC.services;

import com.dh.dentalClinicMVC.dao.DentistDaoH2;
import com.dh.dentalClinicMVC.dao.IDao;
import com.dh.dentalClinicMVC.model.Dentist;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DentistService {

    private IDao<Dentist> dentistIDao;

    public DentistService(IDao<Dentist> dentistIDao) {
        this.dentistIDao = dentistIDao;
    }

    public Dentist save(Dentist dentist) {
        return dentistIDao.save(dentist);
    }

    public void delete(Integer id) {
        dentistIDao.delete(id);
    }

    public void update(Dentist dentist) {
        dentistIDao.update(dentist);
    }

    public Dentist findById(Integer id) {
        return dentistIDao.findById(id);
    }

    public List<Dentist> findAll() {
        return dentistIDao.findAll();
    }

    public IDao<Dentist> getDentistIDao() {
        return dentistIDao;
    }
}
