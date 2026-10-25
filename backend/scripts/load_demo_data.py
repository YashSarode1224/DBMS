#!/usr/bin/env python3
"""
Demo Data Seed Script via Service

Wrapper around the core demo service logic.
Compatible with MySQL 8.0 and PostgreSQL.
"""
import asyncio
import os
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))
sys.path.insert(0, str(backend_path / "core-orbits"))

# Attempt loading .env files
try:
    from dotenv import load_dotenv
    load_dotenv(backend_path / ".env")
    load_dotenv(backend_path.parent / ".env")
except ImportError:
    pass

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

try:
    from app.services.demo import seed_demo_data
except ImportError:
    # Try alternate import if running from different context
    sys.path.append(str(backend_path / "core-orbits"))
    from app.services.demo import seed_demo_data


def get_database_url() -> str:
    url = os.getenv(
        "DATABASE_URL",
        "mysql+aiomysql://constellation:constellation@127.0.0.1:3306/constellation_hub"
    )
    if url.startswith("mysql://"):
        url = url.replace("mysql://", "mysql+aiomysql://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


async def main():
    db_url = get_database_url()
    safe_url = db_url.split("@")[-1] if "@" in db_url else db_url
    print(f"Connecting to database: {safe_url}")
    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            await seed_demo_data(session)
            await session.commit()
            print("[SUCCESS] GUI-ready demo data loaded successfully!")
        except Exception as e:
            print(f"[ERROR] Error during demo data seeding: {e}")
            import traceback
            traceback.print_exc()
            await session.rollback()
            sys.exit(1)
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
