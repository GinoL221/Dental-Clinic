package com.dh.dentalClinicMVC.dao;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DB {

    private static final String DRIVE = "org.h2.Driver";
    private static final String URL = "jdbc:h2:~/dc";
    private static final String USER = "sa";
    private static final String PASSWORD = "sa";

    public static Connection getConnection() throws Exception {
        Class.forName(DRIVE);
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    public static void createTables() {
        if (!Files.exists(Paths.get("schema.sql"))) {
            System.err.println("El archivo schema.sql no existe en la ruta especificada.");
            return;
        }

        try (Connection connection = getConnection();
             Statement statement = connection.createStatement()) {

            String sql = new String(Files.readAllBytes(Paths.get("schema.sql")));
            statement.execute(sql);
            System.out.println("SQL ejecutado correctamente desde archivo externo.");

        } catch (Exception e) {
            System.err.println("Error al ejecutar el archivo schema.sql: " + e.getMessage());
            e.printStackTrace();
        }
    }
}