package com.dh.dentalClinicMVC.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SpecialtyResponseDTO {
  private Long id;
  private String name;
  private String description;
}
