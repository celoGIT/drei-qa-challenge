package com.locationservice.repository;

import com.locationservice.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LocationRepository extends JpaRepository<Location, UUID> {

    /**
     * Checks whether any PREMIUM location exists within 100 metres of the given
     * point.
     * Uses geography casting so ST_DWithin measures in metres regardless of SRID.
     */
    @Query(value = """
            SELECT COUNT(*) > 0
            FROM locations
            WHERE type = 'PREMIUM'
              AND id != :excludeId
              AND ST_DWithin(
                    geometry::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    100
                  )
            """, nativeQuery = true)
    boolean existsPremiumWithin100m(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("excludeId") UUID excludeId);

    /**
     * Search with bounding box filter using ST_MakeEnvelope + ST_Contains.
     * Optional type filter. PREMIUM results sorted first.
     */
    @Query(value = """
            SELECT *
            FROM locations
            WHERE ST_Covers(
                      ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326),
                      geometry
                  )
              AND (:type IS NULL OR type = :type)
            ORDER BY
                CASE WHEN type = 'PREMIUM' THEN 0 ELSE 1 END,
                name
            LIMIT :lim
            """, nativeQuery = true)
    List<Location> searchWithinBoundingBox(
            @Param("minLat") double minLat,
            @Param("minLng") double minLng,
            @Param("maxLat") double maxLat,
            @Param("maxLng") double maxLng,
            @Param("type") String type,
            @Param("lim") int lim);

    /**
     * Search without bounding box — returns all locations with optional type
     * filter.
     * PREMIUM results sorted first.
     */
    @Query(value = """
            SELECT *
            FROM locations
            WHERE (:type IS NULL OR type = :type)
            ORDER BY
                CASE WHEN type = 'PREMIUM' THEN 0 ELSE 1 END,
                name
            LIMIT :lim
            """, nativeQuery = true)
    List<Location> searchAll(
            @Param("type") String type,
            @Param("lim") int lim);

    @Modifying
    @Query("DELETE FROM Location l WHERE l.id = :id")
    int deleteByIdReturningCount(@Param("id") UUID id);

    // ILIKE handles German umlauts (ö,ü,ä) correctly unlike LOWER() which can fail
    // with non-ASCII chars
    @Query(value = "SELECT * FROM locations WHERE name ILIKE :name LIMIT 1", nativeQuery = true)
    Optional<Location> findByNameILike(@Param("name") String name);
}
