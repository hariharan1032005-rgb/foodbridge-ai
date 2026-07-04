from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import Volunteer, Match, FoodDonation, DonationStatus, User

router = APIRouter(prefix="/volunteer", tags=["Volunteer"])


@router.post("/profile", summary="Create volunteer profile")
async def create_volunteer_profile(
    vehicle_type: str, vehicle_number: str, address: str, city: str,
    latitude: float = None, longitude: float = None,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(select(Volunteer).where(Volunteer.user_id == current_user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Volunteer profile already exists")

    volunteer = Volunteer(
        user_id=current_user.id, vehicle_type=vehicle_type,
        vehicle_number=vehicle_number, address=address, city=city,
        latitude=latitude, longitude=longitude, is_available=True
    )
    db.add(volunteer)
    await db.flush()
    return volunteer


@router.get("/profile", summary="Get volunteer profile")
async def get_volunteer_profile(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Volunteer).where(Volunteer.user_id == current_user.id))
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(404, "Volunteer profile not found")
    return volunteer


@router.get("/assignments", summary="Get pickup assignments")
async def get_assignments(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    v_result = await db.execute(select(Volunteer).where(Volunteer.user_id == current_user.id))
    volunteer = v_result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(404, "Volunteer profile not found")

    matches = await db.execute(
        select(Match).where(Match.volunteer_id == volunteer.id).order_by(Match.created_at.desc())
    )
    return matches.scalars().all()


@router.post("/assignments/{match_id}/pickup-confirmed", summary="Confirm food pickup")
async def confirm_pickup(
    match_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(404, "Match not found")

    match.pickup_confirmed_at = datetime.utcnow()
    match.status = DonationStatus.PICKED_UP
    await db.flush()
    return {"message": "Pickup confirmed", "match_id": match_id}


@router.post("/assignments/{match_id}/delivered", summary="Confirm delivery")
async def confirm_delivery(
    match_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(404, "Match not found")

    match.delivered_at = datetime.utcnow()
    match.status = DonationStatus.DELIVERED

    # Update donation status
    d_result = await db.execute(select(FoodDonation).where(FoodDonation.id == match.donation_id))
    donation = d_result.scalar_one_or_none()
    if donation:
        donation.status = DonationStatus.DELIVERED

    # Update volunteer stats
    v_result = await db.execute(select(Volunteer).where(Volunteer.user_id == current_user.id))
    volunteer = v_result.scalar_one_or_none()
    if volunteer:
        volunteer.total_pickups += 1

    await db.flush()
    return {"message": "Delivery confirmed successfully!", "match_id": match_id}


@router.patch("/availability", summary="Toggle availability")
async def toggle_availability(
    is_available: bool,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Volunteer).where(Volunteer.user_id == current_user.id))
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(404, "Volunteer not found")
    volunteer.is_available = is_available
    await db.flush()
    return {"message": f"Availability set to {is_available}"}
