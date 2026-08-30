package com.locationservice.service;

import com.locationservice.dto.CoordinatesDto;
import com.locationservice.dto.CreateLocationRequest;
import com.locationservice.dto.LocationResponse;
import com.locationservice.dto.SearchRequest;
import com.locationservice.entity.Location;
import com.locationservice.entity.LocationType;
import com.locationservice.exception.LocationNotFoundException;
import com.locationservice.exception.PremiumLocationConflictException;
import com.locationservice.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LocationService {

    private static final int SRID = 4326;
    private static final int DEFAULT_LIMIT = 100;

    private final LocationRepository locationRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), SRID);

    @Transactional
    public LocationResponse create(CreateLocationRequest request) {
        double lat = request.getCoordinates().getLat();
        double lng = request.getCoordinates().getLng();

        if (request.getType() == LocationType.PREMIUM) {
            boolean conflict = locationRepository.existsPremiumWithin100m(lat, lng, UUID.fromString("00000000-0000-0000-0000-000000000000"));
            if (conflict) {
                throw new PremiumLocationConflictException(
                        "A premium location already exists within 100 metres of the requested coordinates.");
            }
        }

        Location location = new Location();
        location.setName(request.getName());
        location.setType(request.getType());
        location.setGeometry(toPoint(lat, lng));

        Location saved = locationRepository.save(location);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        int deleted = locationRepository.deleteByIdReturningCount(id);
        if (deleted == 0) {
            throw new LocationNotFoundException("Location not found: " + id);
        }
    }

    @Transactional
    public LocationResponse update(UUID id, CreateLocationRequest request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new LocationNotFoundException("Location not found: " + id));

        double lat = request.getCoordinates().getLat();
        double lng = request.getCoordinates().getLng();

        if (request.getType() == LocationType.PREMIUM) {
            boolean conflict = locationRepository.existsPremiumWithin100m(lat, lng, id);
            if (conflict) {
                throw new PremiumLocationConflictException(
                        "A premium location already exists within 100 metres of the requested coordinates.");
            }
        }

        location.setName(request.getName());
        location.setType(request.getType());
        location.setGeometry(toPoint(lat, lng));

        return toResponse(locationRepository.save(location));
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> search(SearchRequest request) {
        int limit = (request.getLimit() != null && request.getLimit() > 0)
                ? request.getLimit()
                : DEFAULT_LIMIT;

        String typeFilter = (request.getType() != null)
                ? request.getType().name()
                : null;

        boolean hasBoundingBox = request.getP1() != null && !request.getP1().isBlank()
                && request.getP2() != null && !request.getP2().isBlank();

        boolean hasNameBox = request.getName1() != null && !request.getName1().isBlank()
                && request.getName2() != null && !request.getName2().isBlank();

        if (hasNameBox) {
            Location loc1 = locationRepository.findByNameILike(request.getName1())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Location not found: " + request.getName1()));
            Location loc2 = locationRepository.findByNameILike(request.getName2())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Location not found: " + request.getName2()));

            double[] p1 = { loc1.getGeometry().getY(), loc1.getGeometry().getX() };
            double[] p2 = { loc2.getGeometry().getY(), loc2.getGeometry().getX() };

            double minLat = Math.min(p1[0], p2[0]);
            double maxLat = Math.max(p1[0], p2[0]);
            double minLng = Math.min(p1[1], p2[1]);
            double maxLng = Math.max(p1[1], p2[1]);

            return locationRepository
                    .searchWithinBoundingBox(minLat, minLng, maxLat, maxLng, typeFilter, limit)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        if (hasBoundingBox) {
            double[] p1 = parseCoords(request.getP1());
            double[] p2 = parseCoords(request.getP2());

            double minLat = Math.min(p1[0], p2[0]);
            double maxLat = Math.max(p1[0], p2[0]);
            double minLng = Math.min(p1[1], p2[1]);
            double maxLng = Math.max(p1[1], p2[1]);

            return locationRepository
                    .searchWithinBoundingBox(minLat, minLng, maxLat, maxLng, typeFilter, limit)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        return locationRepository
                .searchAll(typeFilter, limit)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ---- helpers ----

    private Point toPoint(double lat, double lng) {
        Point point = geometryFactory.createPoint(new Coordinate(lng, lat));
        point.setSRID(SRID);
        return point;
    }

    private double[] parseCoords(String value) {
        String[] parts = value.split(",");
        if (parts.length != 2) {
            throw new IllegalArgumentException(
                    "Coordinate must be in 'lat,lng' format, got: " + value);
        }
        try {
            return new double[]{
                    Double.parseDouble(parts[0].trim()),
                    Double.parseDouble(parts[1].trim())
            };
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(
                    "Coordinate values must be numeric, got: " + value);
        }
    }

    private LocationResponse toResponse(Location location) {
        Point geom = location.getGeometry();
        return LocationResponse.builder()
                .id(location.getId())
                .name(location.getName())
                .type(location.getType())
                .coordinates(new CoordinatesDto(geom.getY(), geom.getX()))
                .createdAt(location.getCreatedAt())
                .build();
    }
}
