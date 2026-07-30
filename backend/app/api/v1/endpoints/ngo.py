from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import NGO, FoodRequest, Match, DonationStatus, FoodDonation, Donor
from app.schemas.ngo_schema import NGOProfileCreate, FoodRequestCreate
from app.agents.demand_prediction_agent import DemandPredictionAgent
from app.agents.notification_agent import NotificationAgent

router = APIRouter(prefix="/ngo", tags=["NGO"])
demand_agent = DemandPredictionAgent()
notification_agent = NotificationAgent()


@router.post("/profile", summary="Create NGO profile")
async def create_ngo_profile(
    profile: NGOProfileCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(select(NGO).where(NGO.user_id == current_user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "NGO profile already exists")
    ngo = NGO(user_id=current_user.id, **profile.dict())
    db.add(ngo)
    await db.flush()
    await db.refresh(ngo)
    return ngo


@router.get("/profile", summary="Get NGO profile")
async def get_ngo_profile(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NGO).where(NGO.user_id == current_user.id))
    ngo = result.scalar_one_or_none()
    if not ngo:
        raise HTTPException(404, "NGO profile not found")
    return ngo


@router.get("/all", summary="List all verified NGOs")
async def list_ngos(skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(NGO).where(NGO.is_verified == True).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.post("/food-requests", summary="Post a food requirement request")
async def create_food_request(
    request_data: FoodRequestCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(NGO).where(NGO.user_id == current_user.id))
    ngo = result.scalar_one_or_none()
    if not ngo:
        raise HTTPException(404, "NGO profile not found")

    food_request = FoodRequest(ngo_id=ngo.id, **request_data.dict())
    db.add(food_request)
    await db.flush()
    return food_request


@router.get("/matches", summary="Get donation matches for this NGO")
async def get_ngo_matches(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(NGO).where(NGO.user_id == current_user.id))
    ngo = result.scalar_one_or_none()
    if not ngo:
        raise HTTPException(404, "NGO not found")

    matches = await db.execute(
        select(Match).where(Match.ngo_id == ngo.id).order_by(Match.created_at.desc())
    )
    return matches.scalars().all()


@router.post("/matches/{match_id}/accept", summary="Accept a matched donation")
async def accept_match(
    match_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ngo_result = await db.execute(select(NGO).where(NGO.user_id == current_user.id))
    ngo = ngo_result.scalar_one_or_none()
    if not ngo:
        raise HTTPException(404, "NGO not found")

    result = await db.execute(select(Match).where(Match.id == match_id, Match.ngo_id == ngo.id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(404, "Match not found")

    match.ngo_accepted = True
    if match.status == DonationStatus.MATCHED:
        match.status = DonationStatus.ASSIGNED

    donation_result = await db.execute(select(FoodDonation).where(FoodDonation.id == match.donation_id))
    donation = donation_result.scalar_one_or_none()
    donor_user_id = None
    if donation:
        donor_result = await db.execute(select(Donor).where(Donor.id == donation.donor_id))
        donor = donor_result.scalar_one_or_none()
        if donor:
            donor_user_id = donor.user_id

    await db.flush()

    if donor_user_id and current_user:
        ngo_result = await db.execute(select(NGO).where(NGO.id == match.ngo_id))
        ngo = ngo_result.scalar_one_or_none()
        if ngo:
            await notification_agent.notify_donor_accepted(
                db, donor_user_id, ngo.organization_name, match.id
            )

    return {"message": "Donation accepted successfully", "match_id": match_id}


@router.get("/demand-prediction", summary="Get AI demand prediction for this NGO")
async def get_demand_prediction(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(NGO).where(NGO.user_id == current_user.id))
    ngo = result.scalar_one_or_none()
    if not ngo:
        raise HTTPException(404, "NGO not found")

    ngo_dict = {
        "id": ngo.id, "organization_name": ngo.organization_name,
        "ngo_type": ngo.ngo_type, "capacity": ngo.capacity,
        "current_demand": ngo.current_demand, "city": ngo.city
    }
    prediction = await demand_agent.predict(ngo_dict)
    return prediction
