package com.dh.dentalClinicMVC.integration;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.mysql.MySQLContainer;

/**
 * Provides a single shared MySQL 8.4 Testcontainers bean for the cached Spring Boot test context.
 * Lifecycle is managed by Spring Boot's Testcontainers support so all MySQL integration test
 * classes reuse the same running container without restarting it between classes.
 */
@TestConfiguration(proxyBeanMethods = false)
public class MySqlTestcontainersConfig {

  @Bean
  @ServiceConnection
  MySQLContainer mysqlContainer() {
    return new MySQLContainer("mysql:8.4");
  }
}
