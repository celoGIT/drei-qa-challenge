package com.locationservice.dto;

import com.locationservice.entity.LocationType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class SearchRequest {
    private LocationType type;
    private String p1;      // "lat,lng" — raw coordinate corner
    private String p2;      // "lat,lng" — raw coordinate corner
    private String name1;   // existing location name used as bounding box corner
    private String name2;   // existing location name used as bounding box corner
    @Positive
    @Max(10000)
    private Integer limit;
}
