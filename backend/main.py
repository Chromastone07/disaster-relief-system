from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, Base

from models.auth      import User
from models.disaster  import DisasterReport, HelpRequest, Inventory
from models.volunteer import Volunteer, Assignment, Resource
from models.location  import Location
from models.notification import Notification

from routes import auth, disaster, volunteer, maps

app = FastAPI(
    title="Disaster Relief Coordination System",
    description="Full API for coordinating disaster relief across 4 modules.",
    version="1.0.0"
)

# CORS — allow_credentials must be False when using allow_origins=["*"]
# The JWT token is sent in the Authorization header, not as a cookie,
# so credentials=False is correct and safe here.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create any missing tables from models
Base.metadata.create_all(bind=engine)

# ── COMPREHENSIVE DB MIGRATION ──
# Adds any columns that exist in models but are missing from an older Postgres table.
# Every statement uses IF NOT EXISTS so it is fully idempotent.
try:
    with engine.begin() as conn:
        # volunteers table
        conn.execute(text("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS skills VARCHAR;"))
        conn.execute(text("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS location VARCHAR;"))
        conn.execute(text("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS approval_status VARCHAR DEFAULT 'pending';"))
        conn.execute(text("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();"))

        # assignments table
        conn.execute(text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();"))

        # resources table (old volunteer-linked resources)
        conn.execute(text("ALTER TABLE resources ADD COLUMN IF NOT EXISTS approval_status VARCHAR DEFAULT 'pending';"))
        conn.execute(text("ALTER TABLE resources ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();"))
        conn.execute(text("ALTER TABLE resources ADD COLUMN IF NOT EXISTS location_id INTEGER;"))

        # inventory table (disaster inventory)
        conn.execute(text("ALTER TABLE inventory ADD COLUMN IF NOT EXISTS approval_status VARCHAR DEFAULT 'pending';"))
        conn.execute(text("ALTER TABLE inventory ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();"))

    print("✅  DB migration complete — all columns verified.")
except Exception as e:
    print(f"⚠️  Migration skipped: {e}")

app.include_router(auth.router)
app.include_router(disaster.router)
app.include_router(volunteer.router)
app.include_router(maps.router)


@app.get("/")
def root():
    return {
        "message": "Disaster Relief Coordination System is running.",
        "modules": [
            "Auth & Users        → /auth",
            "Disaster & Requests → /disaster",
            "Volunteers          → /volunteers",
            "Maps & Notifications→ /maps"
        ],
        "docs": "/docs"
    }