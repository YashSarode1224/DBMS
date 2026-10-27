"""
API routes for Core Orbits service.
Handles constellation and satellite endpoints.
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from .db import get_db
from .models import ConstellationORM, SatelliteORM
from .schemas import (
    ConstellationCreate, ConstellationResponse, ConstellationList,
    SatelliteCreate, SatelliteResponse, SatelliteList,
    PositionResponse, CoverageResponse, TLEInput
)
from .services.orbit_propagator import OrbitPropagator
from .services.coverage import CoverageCalculator

router = APIRouter()
propagator = OrbitPropagator()
coverage_calc = CoverageCalculator()


# ============ Constellation Endpoints ============

@router.get("/constellations", response_model=ConstellationList)
async def list_constellations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """List all constellations with satellite count."""
    # Get constellations with satellite count
    query = (
        select(
            ConstellationORM,
            func.count(SatelliteORM.id).label("satellite_count")
        )
        .outerjoin(SatelliteORM)
        .group_by(ConstellationORM.id)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    rows = result.all()
    
    constellations = []
    for constellation, sat_count in rows:
        constellations.append(ConstellationResponse(
            id=constellation.id,
            name=constellation.name,
            description=constellation.description,
            metadata=constellation.metadata_ or {},
            satellite_count=sat_count,
            created_at=constellation.created_at,
            updated_at=constellation.updated_at
        ))
    
    return ConstellationList(data=constellations, total=len(constellations))


@router.post("/constellations", response_model=ConstellationResponse, status_code=201)
async def create_constellation(
    constellation: ConstellationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new constellation."""
    db_constellation = ConstellationORM(
        name=constellation.name,
        description=constellation.description,
        metadata_=constellation.metadata
    )
    db.add(db_constellation)
    await db.commit()
    await db.refresh(db_constellation)
    
    return ConstellationResponse(
        id=db_constellation.id,
        name=db_constellation.name,
        description=db_constellation.description,
        metadata=db_constellation.metadata_ or {},
        satellite_count=0,
        created_at=db_constellation.created_at,
        updated_at=db_constellation.updated_at
    )


@router.get("/constellations/{constellation_id}", response_model=ConstellationResponse)
async def get_constellation(
    constellation_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific constellation by ID."""
    query = (
        select(
            ConstellationORM,
            func.count(SatelliteORM.id).label("satellite_count")
        )
        .outerjoin(SatelliteORM)
        .where(ConstellationORM.id == constellation_id)
        .group_by(ConstellationORM.id)
    )
    result = await db.execute(query)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Constellation not found")
    
    constellation, sat_count = row
    return ConstellationResponse(
        id=constellation.id,
        name=constellation.name,
        description=constellation.description,
        metadata=constellation.metadata_ or {},
        satellite_count=sat_count,
        created_at=constellation.created_at,
        updated_at=constellation.updated_at
    )


@router.get("/constellations/{constellation_id}/satellites", response_model=SatelliteList)
async def get_constellation_satellites(
    constellation_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get all satellites in a constellation."""
    # Verify constellation exists
    constellation = await db.get(ConstellationORM, constellation_id)
    if not constellation:
        raise HTTPException(status_code=404, detail="Constellation not found")
    
    query = (
        select(SatelliteORM)
        .where(SatelliteORM.constellation_id == constellation_id)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    satellites = result.scalars().all()
    
    return SatelliteList(
        data=[_satellite_to_response(s) for s in satellites],
        total=len(satellites)
    )


# ============ Satellite Endpoints ============

@router.get("/satellites", response_model=SatelliteList)
async def list_satellites(
    constellation_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """List all satellites, optionally filtered by constellation."""
    query = select(SatelliteORM)
    if constellation_id is not None:
        query = query.where(SatelliteORM.constellation_id == constellation_id)
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    satellites = result.scalars().all()
    
    return SatelliteList(
        data=[_satellite_to_response(s) for s in satellites],
        total=len(satellites)
    )


@router.post("/satellites", response_model=SatelliteResponse, status_code=201)
async def create_satellite(
    satellite: SatelliteCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new satellite with optional TLE data."""
    # Parse TLE epoch if TLE provided
    tle_epoch = None
    if satellite.tle_data:
        tle_epoch = propagator.get_tle_epoch(
            satellite.tle_data.line1,
            satellite.tle_data.line2
        )
    
    db_satellite = SatelliteORM(
        name=satellite.name,
        norad_id=satellite.norad_id,
        constellation_id=satellite.constellation_id,
        tle_line1=satellite.tle_data.line1 if satellite.tle_data else None,
        tle_line2=satellite.tle_data.line2 if satellite.tle_data else None,
        tle_epoch=tle_epoch,
        metadata_=satellite.metadata
    )
    db.add(db_satellite)
    await db.commit()
    await db.refresh(db_satellite)
    
    return _satellite_to_response(db_satellite)


@router.get("/satellites/{satellite_id}", response_model=SatelliteResponse)
async def get_satellite(
    satellite_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific satellite by ID."""
    satellite = await db.get(SatelliteORM, satellite_id)
    if not satellite:
        raise HTTPException(status_code=404, detail="Satellite not found")
    
    return _satellite_to_response(satellite)


@router.put("/satellites/{satellite_id}/tle", response_model=SatelliteResponse)
async def update_satellite_tle(
    satellite_id: int,
    tle: TLEInput,
    db: AsyncSession = Depends(get_db)
):
    """Update satellite TLE data."""
    satellite = await db.get(SatelliteORM, satellite_id)
    if not satellite:
        raise HTTPException(status_code=404, detail="Satellite not found")
    
    # Validate and parse TLE
    try:
        tle_epoch = propagator.get_tle_epoch(tle.line1, tle.line2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid TLE: {str(e)}")
    
    satellite.tle_line1 = tle.line1
    satellite.tle_line2 = tle.line2
    satellite.tle_epoch = tle_epoch
    
    await db.commit()
    await db.refresh(satellite)
    
    return _satellite_to_response(satellite)


@router.get("/satellites/{satellite_id}/position", response_model=PositionResponse)
async def get_satellite_position(
    satellite_id: int,
    time: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get satellite position at a specific time.
    If time is not provided, uses current UTC time.
    """
    satellite = await db.get(SatelliteORM, satellite_id)
    if not satellite:
        raise HTTPException(status_code=404, detail="Satellite not found")
    
    if not satellite.tle_line1 or not satellite.tle_line2:
        raise HTTPException(status_code=400, detail="Satellite has no TLE data")
    
    # Use current time if not specified
    target_time = time or datetime.now(timezone.utc)
    if target_time.tzinfo is None:
        target_time = target_time.replace(tzinfo=timezone.utc)
    
    try:
        position = propagator.compute_position(
            satellite.tle_line1,
            satellite.tle_line2,
            target_time
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Position computation failed: {str(e)}")
    
    return PositionResponse(
        satellite_id=satellite_id,
        satellite_name=satellite.name,
        timestamp=target_time,
        latitude=position["latitude"],
        longitude=position["longitude"],
        altitude_km=position["altitude_km"],
        velocity=position.get("velocity")
    )


@router.get("/satellites/{satellite_id}/coverage", response_model=CoverageResponse)
async def get_satellite_coverage(
    satellite_id: int,
    time: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get satellite ground coverage footprint at a specific time.
    Uses a simple circular footprint based on altitude.
    """
    satellite = await db.get(SatelliteORM, satellite_id)
    if not satellite:
        raise HTTPException(status_code=404, detail="Satellite not found")
    
    if not satellite.tle_line1 or not satellite.tle_line2:
        raise HTTPException(status_code=400, detail="Satellite has no TLE data")
    
    # Use current time if not specified
    target_time = time or datetime.now(timezone.utc)
    if target_time.tzinfo is None:
        target_time = target_time.replace(tzinfo=timezone.utc)
    
    try:
        # Get position first
        position = propagator.compute_position(
            satellite.tle_line1,
            satellite.tle_line2,
            target_time
        )
        
        # Calculate coverage footprint
        coverage = coverage_calc.compute_footprint(
            center_lat=position["latitude"],
            center_lon=position["longitude"],
            altitude_km=position["altitude_km"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Coverage computation failed: {str(e)}")
    
    return CoverageResponse(
        satellite_id=satellite_id,
        satellite_name=satellite.name,
        timestamp=target_time,
        center_latitude=position["latitude"],
        center_longitude=position["longitude"],
        altitude_km=position["altitude_km"],
        radius_km=coverage["radius_km"],
        polygon=coverage.get("polygon")
    )


# ============ Helper Functions ============

def _satellite_to_response(satellite: SatelliteORM) -> SatelliteResponse:
    """Convert ORM model to response schema."""
    tle_data = None
    if satellite.tle_line1 and satellite.tle_line2:
        tle_data = {
            "line1": satellite.tle_line1,
            "line2": satellite.tle_line2,
            "epoch": satellite.tle_epoch
        }
    
    return SatelliteResponse(
        id=satellite.id,
        name=satellite.name,
        norad_id=satellite.norad_id,
        constellation_id=satellite.constellation_id,
        tle_data=tle_data,
        health_status=satellite.health_status,
        metadata=satellite.metadata_ or {},
        created_at=satellite.created_at,
        updated_at=satellite.updated_at
    )


# ============ Database Inspection Endpoints for DBMS Verification ============

@router.get("/db/overview")
async def get_db_overview(db: AsyncSession = Depends(get_db)):
    """Return overview of all MySQL tables and metadata for DBMS verification."""
    tables_res = await db.execute(text("SHOW TABLES;"))
    table_names = [row[0] for row in tables_res.fetchall()]
    
    tables_info = []
    total_rows = 0
    for t in table_names:
        try:
            count_res = await db.execute(text(f"SELECT COUNT(*) FROM `{t}`;"))
            cnt = count_res.scalar() or 0
            total_rows += cnt
            
            cols_res = await db.execute(text(f"DESCRIBE `{t}`;"))
            cols = [
                {"field": r[0], "type": str(r[1]), "null": r[2], "key": r[3], "default": str(r[4])}
                for r in cols_res.fetchall()
            ]
            
            tables_info.append({
                "name": t,
                "rows": cnt,
                "columns": cols
            })
        except Exception as e:
            tables_info.append({
                "name": t,
                "rows": 0,
                "columns": [],
                "error": str(e)
            })
            
    return {
        "status": "connected",
        "database": "constellation_hub",
        "engine": "MySQL 8.0 (InnoDB / utf8mb4)",
        "total_tables": len(tables_info),
        "total_rows": total_rows,
        "tables": tables_info
    }


@router.get("/db/table/{table_name}")
async def get_db_table_data(
    table_name: str,
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve records from a specific MySQL table."""
    tables_res = await db.execute(text("SHOW TABLES;"))
    allowed_tables = [row[0] for row in tables_res.fetchall()]
    if table_name not in allowed_tables:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist.")
    
    res = await db.execute(text(f"SELECT * FROM `{table_name}` LIMIT :limit;"), {"limit": limit})
    columns = list(res.keys())
    raw_rows = res.fetchall()
    
    rows = []
    for r in raw_rows:
        row_dict = {}
        for col, val in zip(columns, r):
            if isinstance(val, (datetime,)):
                row_dict[col] = val.isoformat()
            else:
                row_dict[col] = val
        rows.append(row_dict)
        
    return {
        "table": table_name,
        "count": len(rows),
        "columns": columns,
        "rows": rows
    }


@router.post("/db/execute")
async def execute_db_query(
    payload: dict,
    db: AsyncSession = Depends(get_db)
):
    """Execute a read-only SQL query against MySQL for DBMS inspection."""
    import time
    query_str = (payload.get("query") or "").strip()
    if not query_str:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    
    first_word = query_str.split()[0].upper() if query_str else ""
    if first_word not in ("SELECT", "SHOW", "DESCRIBE", "DESC", "EXPLAIN"):
        raise HTTPException(
            status_code=403, 
            detail="Execution restricted to read-only queries (SELECT, SHOW, DESCRIBE, EXPLAIN)."
        )
    
    start = time.time()
    try:
        res = await db.execute(text(query_str))
        duration_ms = round((time.time() - start) * 1000, 2)
        columns = list(res.keys())
        raw_rows = res.fetchall()
        rows = []
        for r in raw_rows:
            row_dict = {}
            for col, val in zip(columns, r):
                if isinstance(val, (datetime,)):
                    row_dict[col] = val.isoformat()
                else:
                    row_dict[col] = val
            rows.append(row_dict)
            
        return {
            "status": "success",
            "query": query_str,
            "duration_ms": duration_ms,
            "columns": columns,
            "row_count": len(rows),
            "rows": rows
        }
    except Exception as e:
        duration_ms = round((time.time() - start) * 1000, 2)
        return {
            "status": "error",
            "query": query_str,
            "duration_ms": duration_ms,
            "error": str(e)
        }
