package com.dh.dentalClinicMVC.configuration;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("e2e")
@EnableConfigurationProperties(E2eSeedProperties.class)
public class E2eProfileConfiguration {

  public E2eProfileConfiguration(E2eSeedProperties properties) {
    properties.validateRequiredCredentials();
  }
}
