"""
Demo Data Service.

Provides functionality to seed the database with demo data.
Fully compatible with MySQL 8.0 and PostgreSQL.
"""
import json
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from common.auth import hash_password
from common.logger import get_logger

logger = get_logger("demo-service")

# Sample TLE data (Realistic satellites: ISS, Starlink, GPS, OneWeb, Planet, Spire)
DEMO_TLES = [
    {
        "name": "ISS (ZARYA)",
        "norad_id": "25544",
        "tle1": "1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9021",
        "tle2": "2 25544  51.6400 208.9163 0006703 280.7808  79.2154 15.49815776    29",
        "mass_kg": 420000.0,
        "power_watts": 84000.0,
        "orbit_type": "LEO",
    },
    {
        "name": "STARLINK-1007",
        "norad_id": "44713",
        "tle1": "1 44713U 19074A   24001.50000000  .00001234  00000-0  98765-4 0  9012",
        "tle2": "2 44713  53.0000 120.0000 0001500 100.0000 260.0000 15.06000000123456",
        "mass_kg": 260.0,
        "power_watts": 1500.0,
        "orbit_type": "LEO",
    },
    {
        "name": "STARLINK-1008",
        "norad_id": "44714",
        "tle1": "1 44714U 19074B   24001.50000000  .00001234  00000-0  98765-4 0  9013",
        "tle2": "2 44714  53.0000 121.0000 0001500 101.0000 259.0000 15.06000000123457",
        "mass_kg": 260.0,
        "power_watts": 1500.0,
        "orbit_type": "LEO",
    },
    {
        "name": "STARLINK-1009",
        "norad_id": "44715",
        "tle1": "1 44715U 19074C   24001.50000000  .00001234  00000-0  98765-4 0  9014",
        "tle2": "2 44715  53.0000 122.0000 0001500 102.0000 258.0000 15.06000000123458",
        "mass_kg": 260.0,
        "power_watts": 1500.0,
        "orbit_type": "LEO",
    },
    {
        "name": "STARLINK-1010",
        "norad_id": "44716",
        "tle1": "1 44716U 19074D   24001.50000000  .00001234  00000-0  98765-4 0  9015",
        "tle2": "2 44716  53.0000 123.0000 0001500 103.0000 257.0000 15.06000000123459",
        "mass_kg": 260.0,
        "power_watts": 1500.0,
        "orbit_type": "LEO",
    },
    {
        "name": "STARLINK-1011",
        "norad_id": "44717",
        "tle1": "1 44717U 19074E   24001.50000000  .00001234  00000-0  98765-4 0  9016",
        "tle2": "2 44717  53.0000 124.0000 0001500 104.0000 256.0000 15.06000000123460",
        "mass_kg": 260.0,
        "power_watts": 1500.0,
        "orbit_type": "LEO",
    },
    {
        "name": "GPS IIF-12",
        "norad_id": "40730",
        "tle1": "1 40730U 15036A   24001.50000000  .00000045  00000-0  00000-0 0  9011",
        "tle2": "2 40730  55.0000  95.0000 0012000  45.0000 315.0000  2.00560000 62104",
        "mass_kg": 1630.0,
        "power_watts": 2400.0,
        "orbit_type": "MEO",
    },
    {
        "name": "ONEWEB-0045",
        "norad_id": "48925",
        "tle1": "1 48925U 21060A   24001.50000000  .00000210  00000-0  45678-4 0  9018",
        "tle2": "2 48925  87.4000 142.0000 0001200  80.0000 280.0000 13.10000000142345",
        "mass_kg": 147.0,
        "power_watts": 800.0,
        "orbit_type": "LEO",
    },
    {
        "name": "PLANET DOVE-123",
        "norad_id": "49123",
        "tle1": "1 49123U 21080A   24001.50000000  .00001560  00000-0  12345-3 0  9019",
        "tle2": "2 49123  97.5000  58.2000 0001800  90.0000 270.0000 15.20000000152341",
        "mass_kg": 5.0,
        "power_watts": 50.0,
        "orbit_type": "SSO",
    },
    {
        "name": "SPIRE LEMUR-89",
        "norad_id": "49189",
        "tle1": "1 49189U 21095A   24001.50000000  .00001450  00000-0  11234-3 0  9020",
        "tle2": "2 49189  85.0000  78.9000 0001600  95.0000 265.0000 15.15000000151239",
        "mass_kg": 4.5,
        "power_watts": 40.0,
        "orbit_type": "LEO",
    },
]

GROUND_STATIONS = [
    {
        "name": "AWS Ground Station - US West",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "elevation_m": 50.0,
        "min_elevation_deg": 10.0,
        "capabilities": ["S-band", "X-band"],
        "cost_per_minute": 3.0,
    },
    {
        "name": "ESA Ground Station - Europe",
        "latitude": 52.2985,
        "longitude": 5.1719,
        "elevation_m": 100.0,
        "min_elevation_deg": 10.0,
        "capabilities": ["S-band", "X-band", "Ka-band"],
        "cost_per_minute": 4.5,
    },
    {
        "name": "JAXA Ground Station - Asia",
        "latitude": 35.6762,
        "longitude": 139.6503,
        "elevation_m": 20.0,
        "min_elevation_deg": 10.0,
        "capabilities": ["S-band", "X-band"],
        "cost_per_minute": 3.5,
    },
    {
        "name": "Svalbard (SvalSat) - Norway",
        "latitude": 78.2300,
        "longitude": 15.4100,
        "elevation_m": 464.0,
        "min_elevation_deg": 5.0,
        "capabilities": ["S-band", "X-band", "Ka-band", "Optical"],
        "cost_per_minute": 5.0,
    },
    {
        "name": "Wallops Island - NASA US",
        "latitude": 37.9400,
        "longitude": -75.4700,
        "elevation_m": 3.0,
        "min_elevation_deg": 10.0,
        "capabilities": ["UHF", "S-band", "X-band"],
        "cost_per_minute": 2.5,
    },
    {
        "name": "Canberra DSN - Australia",
        "latitude": -35.4000,
        "longitude": 148.9800,
        "elevation_m": 680.0,
        "min_elevation_deg": 10.0,
        "capabilities": ["S-band", "X-band", "Ka-band"],
        "cost_per_minute": 6.0,
    },
]

DEMO_USERS = [
    {
        "username": "demo_viewer",
        "email": "viewer@demo.constellation-hub.local",
        "password": "viewer123",
        "full_name": "Demo Viewer",
        "role": "viewer",
    },
    {
        "username": "demo_ops",
        "email": "ops@demo.constellation-hub.local",
        "password": "operator123",
        "full_name": "Demo Operator",
        "role": "operator",
    },
    {
        "username": "demo_admin",
        "email": "admin@demo.constellation-hub.local",
        "password": "admin123",
        "full_name": "Demo Administrator",
        "role": "admin",
    },
]

async def seed_demo_data(session: AsyncSession):
    """Seed the database with demo data."""
    logger.info("Initializing demo data seed...")
    
    # -------------------------------------------------------------------------
    # 1. Create Constellation
    # -------------------------------------------------------------------------
    logger.info("[SEED] Creating demo constellation...")
    constellation_name = "Demo LEO Constellation"
    existing_const = await session.execute(
        text("SELECT id FROM constellations WHERE name = :name"),
        {"name": constellation_name}
    )
    c_row = existing_const.first()
    if c_row:
        constellation_id = c_row[0]
        logger.info(f"   [EXISTS] Constellation '{constellation_name}' already exists (ID: {constellation_id})")
    else:
        await session.execute(text("""
            INSERT INTO constellations (
                name, description, orbit_type, orbit_regime, altitude_km,
                inclination_deg, num_planes, sats_per_plane, metadata
            ) VALUES (
                :name, :description, :orbit_type, :orbit_regime, :altitude_km,
                :inclination_deg, :num_planes, :sats_per_plane, :metadata
            )
        """), {
            "name": constellation_name,
            "description": "Demonstration constellation for Constellation Hub showcase",
            "orbit_type": "LEO",
            "orbit_regime": "LEO",
            "altitude_km": 550.0,
            "inclination_deg": 53.0,
            "num_planes": 1,
            "sats_per_plane": len(DEMO_TLES),
            "metadata": json.dumps({"source": "demo_seed", "version": "1.0"})
        })
        res = await session.execute(
            text("SELECT id FROM constellations WHERE name = :name"),
            {"name": constellation_name}
        )
        constellation_id = res.scalar_one()
        logger.info(f"   [CREATED] Constellation '{constellation_name}' (ID: {constellation_id})")

    # -------------------------------------------------------------------------
    # 2. Create Satellites and TLE Records
    # -------------------------------------------------------------------------
    logger.info("[SEED] Creating satellites and TLE cache...")
    satellite_ids = {}
    for tle_data in DEMO_TLES:
        # Check if satellite exists
        existing_sat = await session.execute(
            text("SELECT id FROM satellites WHERE norad_id = :norad_id"),
            {"norad_id": tle_data["norad_id"]}
        )
        s_row = existing_sat.first()
        if s_row:
            satellite_ids[tle_data["name"]] = s_row[0]
            logger.info(f"   [EXISTS] Satellite '{tle_data['name']}' already exists (ID: {s_row[0]})")
        else:
            await session.execute(text("""
                INSERT INTO satellites (
                    constellation_id, name, norad_id, tle_line1, tle_line2,
                    mass_kg, power_watts, orbit_type, status, health_status, metadata
                ) VALUES (
                    :constellation_id, :name, :norad_id, :tle1, :tle2,
                    :mass_kg, :power_watts, :orbit_type, :status, :health_status, :metadata
                )
            """), {
                "constellation_id": constellation_id,
                "name": tle_data["name"],
                "norad_id": tle_data["norad_id"],
                "tle1": tle_data["tle1"],
                "tle2": tle_data["tle2"],
                "mass_kg": tle_data["mass_kg"],
                "power_watts": tle_data["power_watts"],
                "orbit_type": tle_data["orbit_type"],
                "status": "operational",
                "health_status": "healthy",
                "metadata": json.dumps({"active_payload": True, "transponder": "operational"})
            })
            res = await session.execute(
                text("SELECT id FROM satellites WHERE norad_id = :norad_id"),
                {"norad_id": tle_data["norad_id"]}
            )
            sat_id = res.scalar_one()
            satellite_ids[tle_data["name"]] = sat_id
            logger.info(f"   [CREATED] Satellite '{tle_data['name']}' (ID: {sat_id})")

        # Ingest into tle_records cache
        existing_tle = await session.execute(
            text("SELECT id FROM tle_records WHERE norad_id = :norad_id"),
            {"norad_id": tle_data["norad_id"]}
        )
        if not existing_tle.first():
            await session.execute(text("""
                INSERT INTO tle_records (norad_id, name, tle_line1, tle_line2, source)
                VALUES (:norad_id, :name, :tle1, :tle2, 'celestrak')
            """), {
                "norad_id": tle_data["norad_id"],
                "name": tle_data["name"],
                "tle1": tle_data["tle1"],
                "tle2": tle_data["tle2"],
            })

    # -------------------------------------------------------------------------
    # 3. Create Ground Stations
    # -------------------------------------------------------------------------
    logger.info("[SEED] Creating ground stations...")
    ground_station_ids = {}
    for gs_data in GROUND_STATIONS:
        existing_gs = await session.execute(
            text("SELECT id FROM ground_stations WHERE name = :name"),
            {"name": gs_data["name"]}
        )
        gs_row = existing_gs.first()
        if gs_row:
            ground_station_ids[gs_data["name"]] = gs_row[0]
            logger.info(f"   [EXISTS] Ground station '{gs_data['name']}' already exists (ID: {gs_row[0]})")
        else:
            await session.execute(text("""
                INSERT INTO ground_stations (
                    name, latitude, longitude, elevation_m, min_elevation_deg,
                    capabilities, health_status, status, is_active, cost_per_minute, metadata
                ) VALUES (
                    :name, :latitude, :longitude, :elevation_m, :min_elevation_deg,
                    :capabilities, :health_status, :status, :is_active, :cost_per_minute, :metadata
                )
            """), {
                "name": gs_data["name"],
                "latitude": gs_data["latitude"],
                "longitude": gs_data["longitude"],
                "elevation_m": gs_data["elevation_m"],
                "min_elevation_deg": gs_data["min_elevation_deg"],
                "capabilities": json.dumps(gs_data["capabilities"]),
                "health_status": "nominal",
                "status": "operational",
                "is_active": True,
                "cost_per_minute": gs_data["cost_per_minute"],
                "metadata": json.dumps({"operator": "Constellation Network Partner"})
            })
            res = await session.execute(
                text("SELECT id FROM ground_stations WHERE name = :name"),
                {"name": gs_data["name"]}
            )
            gs_id = res.scalar_one()
            ground_station_ids[gs_data["name"]] = gs_id
            logger.info(f"   [CREATED] Ground station '{gs_data['name']}' (ID: {gs_id})")

    # -------------------------------------------------------------------------
    # 4. Create Demo Users
    # -------------------------------------------------------------------------
    logger.info("[SEED] Creating demo users...")
    for user_data in DEMO_USERS:
        result = await session.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": user_data["email"]}
        )
        if result.scalar_one_or_none():
            logger.info(f"   [EXISTS] User '{user_data['username']}' already exists, skipping")
            continue
        
        await session.execute(text("""
            INSERT INTO users (username, email, hashed_password, name, full_name, role, is_active)
            VALUES (:username, :email, :hashed_password, :name, :full_name, :role, :is_active)
        """), {
            "username": user_data["username"],
            "email": user_data["email"],
            "hashed_password": hash_password(user_data["password"]),
            "name": user_data["full_name"],
            "full_name": user_data["full_name"],
            "role": user_data["role"],
            "is_active": True
        })
        logger.info(f"   [CREATED] User '{user_data['username']}' ({user_data['email']})")

    # -------------------------------------------------------------------------
    # 5. Create Realistic Contact Passes
    # -------------------------------------------------------------------------
    logger.info("[SEED] Creating realistic contact passes...")
    existing_passes_count = (await session.execute(text("SELECT COUNT(*) FROM passes"))).scalar_one()
    if existing_passes_count == 0:
        base_time = datetime.now(timezone.utc)
        pass_records = []
        sat_list = list(satellite_ids.values())
        gs_list = list(ground_station_ids.values())

        # Generate realistic pass windows over next 24 hours
        offsets_minutes = [25, 115, 205, 300, 420, 540, 680, 810, 960, 1100, 1250, 1390]
        pass_idx = 0
        for i, s_id in enumerate(sat_list):
            for j, g_id in enumerate(gs_list):
                if (i + j) % 2 == 0:
                    offset = offsets_minutes[pass_idx % len(offsets_minutes)] + (i * 15)
                    pass_idx += 1
                    aos = base_time + timedelta(minutes=offset)
                    duration = 480 + ((i * 37 + j * 43) % 360)  # 8 - 14 minutes
                    los = aos + timedelta(seconds=duration)
                    max_el_time = aos + timedelta(seconds=duration // 2)
                    max_elevation_deg = 25.0 + float((i * 17 + j * 29) % 65)  # 25° - 90°
                    priority = "high" if max_elevation_deg > 60 else "medium"
                    is_scheduled = (i + j) % 3 == 0

                    pass_records.append({
                        "satellite_id": s_id,
                        "station_id": g_id,
                        "aos": aos,
                        "los": los,
                        "max_elevation_time": max_el_time,
                        "max_elevation_deg": max_elevation_deg,
                        "duration_seconds": float(duration),
                        "is_scheduled": is_scheduled,
                        "priority": priority,
                        "metadata": json.dumps({"doppler_shift_khz": 24.5, "azimuth_aos_deg": 120.0})
                    })

        for p in pass_records:
            await session.execute(text("""
                INSERT INTO passes (
                    satellite_id, station_id, aos, los, max_elevation_time,
                    max_elevation_deg, duration_seconds, is_scheduled, priority, metadata
                ) VALUES (
                    :satellite_id, :station_id, :aos, :los, :max_elevation_time,
                    :max_elevation_deg, :duration_seconds, :is_scheduled, :priority, :metadata
                )
            """), p)
        logger.info(f"   [CREATED] Generated {len(pass_records)} contact passes")
    else:
        logger.info(f"   [EXISTS] Passes already exist ({existing_passes_count} records)")

    # -------------------------------------------------------------------------
    # 6. Create Inter-Satellite Links (ISL) & Ground Links
    # -------------------------------------------------------------------------
    logger.info("[SEED] Creating routing links...")
    existing_links_count = (await session.execute(text("SELECT COUNT(*) FROM links"))).scalar_one()
    if existing_links_count == 0:
        sat_ids = list(satellite_ids.values())
        link_records = []

        # Inter-Satellite Links (ring topology among Starlinks / satellites)
        for idx in range(len(sat_ids)):
            s_from = sat_ids[idx]
            s_to = sat_ids[(idx + 1) % len(sat_ids)]
            link_records.append({
                "link_type": "inter_satellite",
                "source_type": "satellite",
                "source_id": s_from,
                "target_type": "satellite",
                "target_id": s_to,
                "latency_ms": 5.4 + (idx * 0.3),
                "bandwidth_mbps": 10000.0,
                "cost": 1.0,
                "is_active": True,
                "metadata": json.dumps({"optical_isl": True, "wavelength_nm": 1550})
            })

        # Satellite to Ground Links
        gs_ids = list(ground_station_ids.values())
        for idx in range(min(len(sat_ids), len(gs_ids))):
            link_records.append({
                "link_type": "satellite_ground",
                "source_type": "satellite",
                "source_id": sat_ids[idx],
                "target_type": "ground_station",
                "target_id": gs_ids[idx],
                "latency_ms": 18.2 + (idx * 1.5),
                "bandwidth_mbps": 1200.0,
                "cost": 2.5,
                "is_active": True,
                "metadata": json.dumps({"downlink_freq_ghz": 26.5, "feeder_link": True})
            })

        for link in link_records:
            await session.execute(text("""
                INSERT INTO links (
                    link_type, source_type, source_id, target_type, target_id,
                    latency_ms, bandwidth_mbps, cost, is_active, metadata
                ) VALUES (
                    :link_type, :source_type, :source_id, :target_type, :target_id,
                    :latency_ms, :bandwidth_mbps, :cost, :is_active, :metadata
                )
            """), link)
        logger.info(f"   [CREATED] Generated {len(link_records)} communication links")
    else:
        logger.info(f"   [EXISTS] Links already exist ({existing_links_count} records)")

    # -------------------------------------------------------------------------
    # 7. Create Routing Policies
    # -------------------------------------------------------------------------
    logger.info("[SEED] Creating routing policies...")
    existing_policies = (await session.execute(text("SELECT COUNT(*) FROM policies"))).scalar_one()
    if existing_policies == 0:
        policies = [
            {
                "name": "Lowest Latency Routing",
                "description": "Optimizes paths strictly for minimum round-trip delay across optical ISLs",
                "latency_weight": 1.0,
                "cost_weight": 0.1,
                "hop_weight": 0.2,
                "max_latency_ms": 120.0,
                "max_hops": 6,
                "max_cost": 20.0,
                "is_default": True,
                "preferred_ground_stations": json.dumps(["Svalbard (SvalSat) - Norway", "Wallops Island - NASA US"]),
                "avoided_ground_stations": json.dumps([]),
                "metadata": json.dumps({"target_workload": "realtime_telemetry"})
            },
            {
                "name": "Cost Optimized Routing",
                "description": "Minimizes ground station and downlink fees by batching over lower-cost stations",
                "latency_weight": 0.2,
                "cost_weight": 1.0,
                "hop_weight": 0.4,
                "max_latency_ms": 300.0,
                "max_hops": 8,
                "max_cost": 5.0,
                "is_default": False,
                "preferred_ground_stations": json.dumps(["Wallops Island - NASA US", "AWS Ground Station - US West"]),
                "avoided_ground_stations": json.dumps([]),
                "metadata": json.dumps({"target_workload": "bulk_earth_observation"})
            },
            {
                "name": "High Reliability Resilient",
                "description": "Multi-path redundant routing with hop count caps and high elevation constraints",
                "latency_weight": 0.6,
                "cost_weight": 0.3,
                "hop_weight": 0.5,
                "max_latency_ms": 150.0,
                "max_hops": 4,
                "max_cost": 15.0,
                "is_default": False,
                "preferred_ground_stations": json.dumps([]),
                "avoided_ground_stations": json.dumps([]),
                "metadata": json.dumps({"target_workload": "critical_command_uplink"})
            }
        ]
        for pol in policies:
            await session.execute(text("""
                INSERT INTO policies (
                    name, description, latency_weight, cost_weight, hop_weight,
                    max_latency_ms, max_hops, max_cost, preferred_ground_stations,
                    avoided_ground_stations, is_default, metadata
                ) VALUES (
                    :name, :description, :latency_weight, :cost_weight, :hop_weight,
                    :max_latency_ms, :max_hops, :max_cost, :preferred_ground_stations,
                    :avoided_ground_stations, :is_default, :metadata
                )
            """), pol)
        logger.info(f"   [CREATED] Created {len(policies)} routing policies")
    else:
        logger.info(f"   [EXISTS] Policies already exist ({existing_policies} records)")

    # -------------------------------------------------------------------------
    # 8. Create Data Queues
    # -------------------------------------------------------------------------
    logger.info("[SEED] Creating satellite data queues...")
    existing_queues = (await session.execute(text("SELECT COUNT(*) FROM data_queues"))).scalar_one()
    if existing_queues == 0:
        for idx, (s_name, s_id) in enumerate(satellite_ids.items()):
            crit = 50.0 + (idx * 20.0)
            high = 200.0 + (idx * 50.0)
            med = 500.0 + (idx * 100.0)
            low = 1000.0 + (idx * 150.0)
            tot = crit + high + med + low
            allocs = {
                "mission_payload": crit + high,
                "customer_batch": med + low
            }
            await session.execute(text("""
                INSERT INTO data_queues (
                    satellite_id, critical_volume_mb, high_volume_mb,
                    medium_volume_mb, low_volume_mb, total_volume_mb,
                    customer_allocations
                ) VALUES (
                    :satellite_id, :critical, :high, :med, :low, :total, :customer_allocations
                )
            """), {
                "satellite_id": s_id,
                "critical": crit,
                "high": high,
                "med": med,
                "low": low,
                "total": tot,
                "customer_allocations": json.dumps(allocs)
            })
        logger.info(f"   [CREATED] Initialized data queues for {len(satellite_ids)} satellites")
    else:
        logger.info(f"   [EXISTS] Data queues already exist ({existing_queues} records)")

    # -------------------------------------------------------------------------
    # 9. Create Nominal Schedule
    # -------------------------------------------------------------------------
    logger.info("[SEED] Creating nominal schedule...")
    existing_schedules = (await session.execute(text("SELECT COUNT(*) FROM schedules"))).scalar_one()
    if existing_schedules == 0:
        sched_start = datetime.now(timezone.utc)
        sched_end = sched_start + timedelta(hours=24)
        passes_res = await session.execute(text("SELECT id FROM passes LIMIT 10"))
        scheduled_pass_ids = [row[0] for row in passes_res.fetchall()]

        await session.execute(text("""
            INSERT INTO schedules (
                name, start_time, end_time, is_active, is_optimized,
                scheduled_passes, total_contact_minutes, total_data_volume_mb, metadata
            ) VALUES (
                :name, :start_time, :end_time, :is_active, :is_optimized,
                :scheduled_passes, :total_contact_minutes, :total_data_volume_mb, :metadata
            )
        """), {
            "name": "Nominal 24-Hour Downlink Plan",
            "start_time": sched_start,
            "end_time": sched_end,
            "is_active": True,
            "is_optimized": True,
            "scheduled_passes": json.dumps(scheduled_pass_ids),
            "total_contact_minutes": 142.5,
            "total_data_volume_mb": 58400.0,
            "metadata": json.dumps({"generated_by": "PassSchedulerAgent", "optimization_solver": "heuristic"})
        })
        logger.info("   [CREATED] Created active nominal schedule")
    else:
        logger.info(f"   [EXISTS] Schedules already exist ({existing_schedules} records)")

    logger.info("[COMPLETE] Demo data seed completed successfully!")
    return {"status": "success", "message": "Demo data loaded successfully"}
