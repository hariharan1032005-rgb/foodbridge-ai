from fastapi import APIRouter
from app.api.v1.endpoints import auth, donations, ngo, volunteer, dashboard, reports, locations, tracking

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(donations.router)
api_router.include_router(ngo.router)
api_router.include_router(volunteer.router)
api_router.include_router(dashboard.router)
api_router.include_router(reports.router)
api_router.include_router(locations.router)
api_router.include_router(tracking.router)
