package com.locationservice.dto;

import com.locationservice.entity.LocationType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateLocationRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;

    @NotNull(message = "Type is required")
    private LocationType type;

    @NotNull(message = "Coordinates are required")
    @Valid
    private CoordinatesDto coordinates;
}
