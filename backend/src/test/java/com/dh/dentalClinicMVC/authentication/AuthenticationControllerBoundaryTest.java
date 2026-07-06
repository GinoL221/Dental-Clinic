package com.dh.dentalClinicMVC.authentication;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import com.dh.dentalClinicMVC.repository.IUserRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import org.junit.jupiter.api.Test;

class AuthenticationControllerBoundaryTest {

  @Test
  void authenticationControllerDoesNotDirectlyDependOnRepositoryTypes() throws IOException {
    assertNoRepositoryTypes(AuthenticationController.class.getDeclaredFields());
    assertNoRepositoryTypes(AuthenticationController.class.getDeclaredConstructors());
    assertNoRepositoryTypes(AuthenticationController.class.getDeclaredMethods());

    Path source =
        Path.of(
            "src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationController.java");
    String imports =
        Files.readAllLines(source).stream()
            .filter(line -> line.startsWith("import "))
            .reduce("", (left, right) -> left + right + "\n");

    assertFalse(
        imports.contains("com.dh.dentalClinicMVC.repository."),
        "Controller source must not import repository packages");
    assertFalse(
        imports.contains(IUserRepository.class.getName()),
        "Controller source must not import IUserRepository");
  }

  private static void assertNoRepositoryTypes(java.lang.reflect.Field[] fields) {
    Arrays.stream(fields).forEach(field -> assertNoRepositoryType(field.getType()));
  }

  private static void assertNoRepositoryTypes(java.lang.reflect.Constructor<?>[] constructors) {
    Arrays.stream(constructors)
        .forEach(
            constructor -> {
              Arrays.stream(constructor.getParameterTypes())
                  .forEach(AuthenticationControllerBoundaryTest::assertNoRepositoryType);
            });
  }

  private static void assertNoRepositoryTypes(java.lang.reflect.Method[] methods) {
    Arrays.stream(methods)
        .forEach(
            method -> {
              assertNoRepositoryType(method.getReturnType());
              Arrays.stream(method.getParameterTypes())
                  .forEach(AuthenticationControllerBoundaryTest::assertNoRepositoryType);
            });
  }

  private static void assertNoRepositoryType(Class<?> type) {
    assertFalse(
        type.getPackageName().startsWith("com.dh.dentalClinicMVC.repository"),
        "Unexpected repository type dependency: " + type.getName());
    assertNotEquals(IUserRepository.class, type, "Unexpected direct dependency on IUserRepository");
  }
}
