from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

from models.auth      import User
from models.disaster  import DisasterReport, HelpRequest
from models.volunteer import Volunteer, Assignment, Resource
from models.location  import Location
from models.notification import Notification

from routes import auth, disaster, volunteer, maps
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Disaster Relief Coordination System",
    description="Full API for coordinating disaster relief across 4 modules.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

Base.metadata.create_all(bind=engine)

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