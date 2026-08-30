package com.locationservice.controller;

import com.locationservice.dto.CreateLocationRequest;
import com.locationservice.dto.LocationResponse;
import com.locationservice.dto.SearchRequest;
import com.locationservice.entity.LocationType;
import com.locationservice.service.LocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/locations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Locations", description = "Create and search geographic locations")
public class LocationController {

    private final LocationService locationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a location", description = "Creates a new location. PREMIUM locations must be more than 100 m away from any existing PREMIUM location.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Location created successfully"),
        @ApiResponse(responseCode = "409", description = "A PREMIUM location already exists within 100 m"),
        @ApiResponse(responseCode = "400", description = "Validation failed")
    })
    public LocationResponse create(@Valid @RequestBody CreateLocationRequest request) {
        return locationService.create(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a location", description = "Permanently removes the location with the given ID.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Location deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Location not found")
    })
    public void delete(@Parameter(description = "Location UUID") @PathVariable UUID id) {
        locationService.delete(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a location", description = "Updates name, type, and coordinates. Re-checks the 100 m PREMIUM rule only when upgrading from STANDARD to PREMIUM.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Location updated successfully"),
        @ApiResponse(responseCode = "404", description = "Location not found"),
        @ApiResponse(responseCode = "409", description = "A PREMIUM location already exists within 100 m"),
        @ApiResponse(responseCode = "400", description = "Validation failed")
    })
    public LocationResponse update(
            @Parameter(description = "Location UUID") @PathVariable UUID id,
            @Valid @RequestBody CreateLocationRequest request) {
        return locationService.update(id, request);
    }

    @GetMapping("/search")
    @Operation(summary = "Search locations", description = "Search by bounding box (p1+p2 or name1+name2), with optional type filter and limit.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "List of matching locations — PREMIUM first, then by name"),
        @ApiResponse(responseCode = "400", description = "Location name not found when using name1/name2")
    })
    public List<LocationResponse> search(
            @Parameter(description = "Filter by PREMIUM or STANDARD") @RequestParam(required = false) LocationType type,
            @Parameter(description = "Bounding box corner 1 as lat,lng") @RequestParam(required = false) String p1,
            @Parameter(description = "Bounding box corner 2 as lat,lng") @RequestParam(required = false) String p2,
            @Parameter(description = "Existing location name as corner 1") @RequestParam(required = false) String name1,
            @Parameter(description = "Existing location name as corner 2") @RequestParam(required = false) String name2,
            @Parameter(description = "Max results (default 100)") @RequestParam(required = false) Integer limit
    ) {
        SearchRequest request = new SearchRequest();
        request.setType(type);
        request.setP1(p1);
        request.setP2(p2);
        request.setName1(name1);
        request.setName2(name2);
        request.setLimit(limit);
        return locationService.search(request);
    }
}
