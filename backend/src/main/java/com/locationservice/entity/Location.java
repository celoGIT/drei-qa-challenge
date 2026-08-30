package com.locationservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;
import org.locationtech.jts.geom.Point;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a geographic location stored in the database.
 * Each location has a name, a type (PREMIUM or STANDARD),
 * and a coordinate (latitude and longitude).
 */
@Entity
@Table(name = "locations")
@Getter
@Setter
@NoArgsConstructor
public class Location {

    // Unique ID for each location
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Name of the location
    @Column(nullable = false, length = 255)
    private String name;

    // Type is either PREMIUM or STANDARD
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LocationType type;

    // Stores the latitude and longitude using PostGIS geometry type
    @Column(columnDefinition = "geometry(Point, 4326)", nullable = false)
    private Point geometry;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private Instant createdAt;
}
