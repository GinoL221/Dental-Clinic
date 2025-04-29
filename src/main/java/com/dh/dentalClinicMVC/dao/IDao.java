package com.dh.dentalClinicMVC.dao;

import java.util.List;

public interface IDao<T> {

    T save(T t);

    T findById(Integer id);

    void update(T t);

    void delete(Integer id);

    List<T> findAll();

    T findByString(String value);
}
