-- =============================================================================
-- Constellation Hub MySQL 8.0 DDL Schema
-- Compatible with MySQL 8.0 InnoDB engine
-- =============================================================================

CREATE DATABASE IF NOT EXISTS constellation_hub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE constellation_hub;

-- -----------------------------------------------------------------------------
-- 1. Users Table (Authentication & Access Control)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NULL,
    email VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT '',
    full_name VARCHAR(255) NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    api_key VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_login DATETIME(6) NULL,
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_api_key (api_key),
    INDEX ix_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Constellations Table (Core Orbits)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS constellations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    operator VARCHAR(255) NULL,
    orbit_type VARCHAR(50) NULL,
    orbit_regime VARCHAR(50) NULL,
    num_planes INT NULL,
    sats_per_plane INT NULL,
    altitude_km DOUBLE NULL,
    inclination_deg DOUBLE NULL,
    metadata JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_constellations_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Satellites Table (Core Orbits)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS satellites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    constellation_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    norad_id VARCHAR(50) NULL,
    international_designator VARCHAR(50) NULL,
    tle_line1 VARCHAR(70) NULL,
    tle_line2 VARCHAR(70) NULL,
    tle_epoch DATETIME(6) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'operational',
    health_status VARCHAR(50) NOT NULL DEFAULT 'healthy',
    mass_kg DOUBLE NULL,
    power_watts DOUBLE NULL,
    orbit_type VARCHAR(50) NULL,
    metadata JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_satellites_constellation FOREIGN KEY (constellation_id) REFERENCES constellations(id) ON DELETE CASCADE,
    INDEX ix_satellites_norad_id (norad_id),
    INDEX ix_satellites_constellation_id (constellation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Ground Stations Table (Ground Scheduler)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ground_stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    elevation_m DOUBLE NOT NULL DEFAULT 0.0,
    min_elevation_deg DOUBLE NOT NULL DEFAULT 10.0,
    capabilities JSON NULL,
    health_status VARCHAR(50) NOT NULL DEFAULT 'nominal',
    status VARCHAR(50) NOT NULL DEFAULT 'operational',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    cost_per_minute DOUBLE NOT NULL DEFAULT 1.0,
    metadata JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_ground_stations_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Passes Table (Visibility Windows)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS passes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    satellite_id INT NOT NULL,
    station_id INT NOT NULL,
    aos DATETIME(6) NOT NULL,
    los DATETIME(6) NOT NULL,
    max_elevation_time DATETIME(6) NULL,
    max_elevation_deg DOUBLE NULL,
    duration_seconds DOUBLE NOT NULL,
    is_scheduled BOOLEAN NOT NULL DEFAULT FALSE,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    metadata JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_passes_station FOREIGN KEY (station_id) REFERENCES ground_stations(id) ON DELETE CASCADE,
    INDEX ix_passes_satellite_id (satellite_id),
    INDEX ix_passes_station_id (station_id),
    INDEX ix_passes_aos (aos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Links Table (Routing / ISL & Downlink)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    link_type VARCHAR(50) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id INT NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INT NOT NULL,
    latency_ms DOUBLE NULL,
    bandwidth_mbps DOUBLE NULL,
    cost DOUBLE NULL DEFAULT 1.0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX ix_links_source (source_type, source_id),
    INDEX ix_links_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Policies Table (Routing Policies)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    latency_weight DOUBLE NOT NULL DEFAULT 1.0,
    cost_weight DOUBLE NOT NULL DEFAULT 0.5,
    hop_weight DOUBLE NOT NULL DEFAULT 0.3,
    max_latency_ms DOUBLE NULL,
    max_hops INT NULL,
    max_cost DOUBLE NULL,
    preferred_ground_stations JSON NULL,
    avoided_ground_stations JSON NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_policies_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create routing_policies view for compatibility with models expecting routing_policies
CREATE OR REPLACE VIEW routing_policies AS SELECT * FROM policies;

-- -----------------------------------------------------------------------------
-- 8. Schedules Table (Ground Scheduler)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NULL,
    start_time DATETIME(6) NOT NULL,
    end_time DATETIME(6) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_optimized BOOLEAN NOT NULL DEFAULT FALSE,
    scheduled_passes JSON NULL,
    total_contact_minutes DOUBLE NULL DEFAULT 0.0,
    total_data_volume_mb DOUBLE NULL DEFAULT 0.0,
    metadata JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Data Queues Table (Downlink Queue Priority)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_queues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    satellite_id INT NOT NULL,
    critical_volume_mb DOUBLE NOT NULL DEFAULT 0.0,
    high_volume_mb DOUBLE NOT NULL DEFAULT 0.0,
    medium_volume_mb DOUBLE NOT NULL DEFAULT 0.0,
    low_volume_mb DOUBLE NOT NULL DEFAULT 0.0,
    total_volume_mb DOUBLE NOT NULL DEFAULT 0.0,
    customer_allocations JSON NULL,
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_data_queues_satellite_id (satellite_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. TLE Records Table (Ephemeris Feed Cache)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tle_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    norad_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NULL,
    tle_line1 VARCHAR(70) NOT NULL,
    tle_line2 VARCHAR(70) NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'celestrak',
    epoch DATETIME(6) NULL,
    fetched_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX ix_tle_records_norad_id (norad_id),
    INDEX ix_tle_records_fetched_at (fetched_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. Alembic Version Table (Migration tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO alembic_version (version_num)
SELECT '001_initial'
WHERE NOT EXISTS (SELECT 1 FROM alembic_version WHERE version_num = '001_initial');
