package com.locationservice.dto;

import com.locationservice.entity.LocationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationResponse {
    private UUID id;
    private String name;
    private LocationType type;
    private CoordinatesDto coordinates;
    private Instant createdAt;
}
