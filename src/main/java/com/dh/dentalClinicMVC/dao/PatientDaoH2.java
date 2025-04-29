package com.dh.dentalClinicMVC.dao;

import com.dh.dentalClinicMVC.model.Address;
import com.dh.dentalClinicMVC.model.Patient;
import org.springframework.stereotype.Component;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@Component
public class PatientDaoH2 implements IDao<Patient> {

    private static final String SQL_INSERT = "INSERT INTO PATIENTS(NAME, LAST_NAME, EMAIL, CARD_IDENTITY, " +
            "ADMISSION_DATE, ADDRESS_ID) VALUES (?, ?, ?, ?, ?, ?)";

    private static final String SQL_SELECT_ID = "SELECT * FROM PATIENTS WHERE ID = ?";

    private static final String SQL_UPDATE = "UPDATE PATIENTS SET NAME = ?, LAST_NAME = ?, EMAIL = ?, " +
            "CARD_IDENTITY = ?, ADMISSION_DATE = ?, ADDRESS_ID = ? WHERE ID = ?";

    private static final String SQL_DELETE = "DELETE FROM PATIENTS WHERE ID = ?";

    private static final String SQL_SELECT_ALL = "SELECT * FROM PATIENTS";

    private static final String SQL_SELECT_EMAIL = "SELECT * FROM PATIENTS WHERE EMAIL = ?";

    @Override
    public Patient save(Patient patient) {
        Connection connection = null;
        try {
            AddressDaoH2 addressDaoH2 = new AddressDaoH2();
            addressDaoH2.save(patient.getAddress());

            connection = DB.getConnection();
            PreparedStatement ps = connection.prepareStatement(SQL_INSERT, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, patient.getName());
            ps.setString(2, patient.getLastName());
            ps.setString(3, patient.getEmail());
            ps.setInt(4, patient.getCardIdentity());
            ps.setDate(5, java.sql.Date.valueOf(patient.getAdmissionDate()));
            ps.setInt(6, patient.getAddress().getId());
            ps.execute();

            ResultSet rs = ps.getGeneratedKeys();
            while (rs.next()) {
                patient.setId(rs.getInt(1));
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (connection != null) {
                    connection.close();
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        return patient;
    }

    @Override
    public Patient findById(Integer id) {
        Connection connection = null;
        Patient patient = null;
        try {
            connection = DB.getConnection();

            PreparedStatement ps = connection.prepareStatement(SQL_SELECT_ID);
            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();

            AddressDaoH2 addressDaoH2 = new AddressDaoH2();
            while (rs.next()) {
                Address address = addressDaoH2.findById(rs.getInt(7));

                patient = new Patient(rs.getInt(1),
                        rs.getString(2),
                        rs.getString(3),
                        rs.getString(4),
                        rs.getInt(5),
                        rs.getDate(6).toLocalDate(),
                        address);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (connection != null) {
                    connection.close();
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        return patient;
    }

    @Override
    public void update(Patient patient) {
        Connection connection = null;
        try {
            connection = DB.getConnection();
            PreparedStatement ps = connection.prepareStatement(SQL_UPDATE);
            ps.setString(1, patient.getName());
            ps.setString(2, patient.getLastName());
            ps.setString(3, patient.getEmail());
            ps.setInt(4, patient.getCardIdentity());
            ps.setDate(5, Date.valueOf(patient.getAdmissionDate()));
            ps.setInt(6, patient.getAddress().getId());
            ps.setInt(7, patient.getId());
            ps.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (connection != null) {
                    connection.close();
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    public void delete(Integer id) {
        Connection connection = null;
        try {
            connection = DB.getConnection();
            PreparedStatement ps = connection.prepareStatement(SQL_DELETE);
            ps.setInt(1, id);
            ps.execute();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (connection != null) {
                    connection.close();
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    public List<Patient> findAll() {
        Connection connection = null;
        Address address = null;
        List<Patient> patients = new ArrayList<>();
        try {
            AddressDaoH2 addressDaoH2 = new AddressDaoH2();
            connection = DB.getConnection();
            PreparedStatement ps = connection.prepareStatement(SQL_SELECT_ALL);

            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                address = new AddressDaoH2().findById(rs.getInt(7));

                patients.add(new Patient(rs.getInt(1),
                        rs.getString(2),
                        rs.getString(3),
                        rs.getString(4),
                        rs.getInt(5),
                        rs.getDate(6).toLocalDate(),
                        address));
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (connection != null) {
                    connection.close();
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        return patients;
    }

    @Override
    public Patient findByString(String value) {
        Connection connection = null;
        Patient patient = null;
        try {
            connection = DB.getConnection();
            PreparedStatement ps = connection.prepareStatement(SQL_SELECT_EMAIL);
            ps.setString(1, value);

            ResultSet rs = ps.executeQuery();
            AddressDaoH2 addressDaoH2 = new AddressDaoH2();
            while (rs.next()) {
                Address address = addressDaoH2.findById(rs.getInt(7));
                patient = new Patient(rs.getInt(1),
                        rs.getString(2),
                        rs.getString(3),
                        rs.getString(4),
                        rs.getInt(5),
                        rs.getDate(6).toLocalDate(),
                        address);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (connection != null) {
                    connection.close();
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        return patient;
    }
}
