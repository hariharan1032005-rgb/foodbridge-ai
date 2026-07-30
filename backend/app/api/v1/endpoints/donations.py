from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import os, uuid, aiofiles
from datetime import datetime

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import Donor, FoodDonation, NGO, Volunteer, Match, DonationStatus
from app.schemas.donation_schema import FoodDonationCreate, FoodDonationResponse, DonorProfileCreate
from app.agents.workflow import foodbridge_workflow
from app.agents.notification_agent import NotificationAgent
from app.agents.route_optimization_agent import haversine_distance
from app.core.config import settings

router = APIRouter(prefix="/donations", tags=["Donations"])
notification_agent = NotificationAgent()


@router.post("/donor/profile", summary="Create donor profile")
async def create_donor_profile(
    profile: DonorProfileCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(select(Donor).where(Donor.user_id == current_user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Donor profile already exists")

    donor = Donor(user_id=current_user.id, **profile.dict())
    db.add(donor)
    await db.flush()
    await db.refresh(donor)
    return donor


@router.get("/donor/profile", summary="Get donor profile")
async def get_donor_profile(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Donor).where(Donor.user_id == current_user.id))
    donor = result.scalar_one_or_none()
    if not donor:
        raise HTTPException(404, "Donor profile not found")
    return donor


@router.post("/", response_model=FoodDonationResponse, summary="Post a food donation")
async def create_donation(
    donation_data: FoodDonationCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get donor profile
    result = await db.execute(select(Donor).where(Donor.user_id == current_user.id))
    donor = result.scalar_one_or_none()
    if not donor:
        raise HTTPException(400, "Please create a donor profile first")

    # Create donation
    donation_payload = donation_data.dict()
    selected_ngo_id = donation_payload.pop('selected_ngo_id', None)
    donation = FoodDonation(donor_id=donor.id, **donation_payload)
    db.add(donation)
    await db.flush()

    selected_ngo = None
    volunteer_assignment = {}
    ngos_result = await db.execute(select(NGO).where(NGO.is_verified == True))
    ngos = ngos_result.scalars().all()
    volunteers_result = await db.execute(select(Volunteer).where(Volunteer.is_available == True))
    volunteers = volunteers_result.scalars().all()

    ngo_dicts = [{"id": n.id, "organization_name": n.organization_name,
                  "capacity": n.capacity, "latitude": n.latitude, "longitude": n.longitude,
                  "preferred_food_categories": n.preferred_food_categories,
                  "accepts_nonveg": n.accepts_nonveg, "current_demand": n.current_demand}
                 for n in ngos]
    vol_dicts = [{"id": v.id, "user_id": v.user_id, "latitude": v.latitude, "longitude": v.longitude,
                  "vehicle_type": v.vehicle_type, "is_available": v.is_available}
                 for v in volunteers]
    donation_dict = {
        "food_name": donation.food_name, "food_category": donation.food_category,
        "is_veg": donation.is_veg, "quantity_kg": donation.quantity_kg,
        "quantity_servings": donation.quantity_servings, "pickup_address": donation.pickup_address,
        "pickup_latitude": donation.pickup_latitude, "pickup_longitude": donation.pickup_longitude,
        "prepared_at": str(donation.prepared_at) if donation.prepared_at else None,
        "expires_at": str(donation.expires_at), "description": donation.description
    }

    result_workflow = {"state": {}}
    matches = []
    match = None

    try:
        if selected_ngo_id:
            selected_ngo = await db.execute(select(NGO).where(NGO.id == selected_ngo_id, NGO.is_verified == True))
            selected_ngo = selected_ngo.scalar_one_or_none()
            if not selected_ngo:
                raise HTTPException(400, "Selected NGO is not available for donations")

            # Find nearest volunteer for the selected NGO route
            volunteer_assignment = {}
            if volunteers:
                pickup_lat = donation.pickup_latitude or 0
                pickup_lon = donation.pickup_longitude or 0
                best_dist = float('inf')
                for v in volunteers:
                    if v.latitude is None or v.longitude is None:
                        continue
                    dist = haversine_distance(pickup_lat, pickup_lon, v.latitude, v.longitude)
                    if dist < best_dist:
                        best_dist = dist
                        volunteer_assignment = {"id": v.id, "user_id": v.user_id, "distance_to_pickup_km": round(dist, 2)}

            donation.status = DonationStatus.MATCHED
            match = Match(
                donation_id=donation.id,
                ngo_id=selected_ngo.id,
                volunteer_id=volunteer_assignment.get("id") if volunteer_assignment else None,
                matching_score=100.0,
                distance_km=volunteer_assignment.get("distance_to_pickup_km") if volunteer_assignment else None,
                estimated_delivery_time=None,
                ai_explanation=f"Selected NGO: {selected_ngo.organization_name}",
                route_info=None,
                status=DonationStatus.MATCHED
            )
            db.add(match)
            await db.flush()

            donation.ai_analysis = {
                "selected_ngo": {"id": selected_ngo.id, "organization_name": selected_ngo.organization_name},
                "volunteer_assignment": volunteer_assignment,
            }
            donation.pickup_priority = "normal"

            await notification_agent.notify_match_found(
                db, current_user.id, selected_ngo.organization_name, donation.id
            )
            if selected_ngo.user_id:
                await notification_agent.notify_ngo_donation(
                    db, selected_ngo.user_id, donation.food_name, match.id
                )
                match.ngo_notified = True
        else:
            result_workflow = await foodbridge_workflow.run(donation_dict, ngo_dicts, vol_dicts)
            state = result_workflow["state"]

            # Update donation with AI results
            analysis = state.get("food_analysis", {}).get("analysis", {})
            shelf = state.get("shelf_life", {}).get("prediction", {})
            donation.freshness_score = analysis.get("freshness_score")
            donation.quality_score = analysis.get("quality_score")
            donation.shelf_life_hours = shelf.get("remaining_shelf_life_hours")
            donation.spoilage_risk = shelf.get("spoilage_risk")
            donation.pickup_priority = shelf.get("pickup_priority")
            donation.ai_analysis = {
                "food_analysis": state.get("food_analysis"),
                "shelf_life": state.get("shelf_life"),
                "recommendation": state.get("recommendation"),
                "volunteer_assignment": state.get("volunteer_assignment"),
            }

            # Auto-create match if NGOs found
            matches = state.get("matches", []) or []
            if matches:
                top = matches[0]
                donation.status = DonationStatus.MATCHED
                volunteer_assignment = state.get("volunteer_assignment") or {}
                match = Match(
                    donation_id=donation.id,
                    ngo_id=top["ngo_id"],
                    volunteer_id=volunteer_assignment.get("id"),
                    matching_score=top.get("matching_score"),
                    distance_km=top.get("distance_km"),
                    estimated_delivery_time=top.get("estimated_delivery_time"),
                    ai_explanation=top.get("ai_explanation"),
                    route_info=state.get("route"),
                    status=DonationStatus.MATCHED
                )
                db.add(match)

                # Notify donor and NGO when a match is found
                await notification_agent.notify_match_found(
                    db, current_user.id, top.get("ngo_name") or "NGO", donation.id
                )
                ngo_obj = None
                if top.get("ngo_id"):
                    ngo_result = await db.execute(select(NGO).where(NGO.id == top["ngo_id"]))
                    ngo_obj = ngo_result.scalar_one_or_none()
                if ngo_obj and ngo_obj.user_id:
                    await notification_agent.notify_ngo_donation(
                        db, ngo_obj.user_id, donation.food_name, match.id
                    )
                    match.ngo_notified = True

        # Update donor stats
        donor.total_donations += 1

    except Exception as e:
        donation.ai_analysis = {"error": str(e)}

    await db.flush()
    await db.refresh(donation)

    # Notify donor of donation creation
    await notification_agent.notify_donation_posted(db, current_user.id, donation.id)

    # Notify nearest volunteer if assigned during matching
    if selected_ngo_id:
        if volunteer_assignment and volunteer_assignment.get("user_id") and match is not None:
            await notification_agent.notify_volunteer_pickup(db, volunteer_assignment["user_id"], match.id)
            match.volunteer_notified = True
    else:
        volunteer_assignment = result_workflow["state"].get("volunteer_assignment") or {}
        volunteer_user_id = volunteer_assignment.get("user_id")
        if volunteer_user_id and matches and match is not None:
            await notification_agent.notify_volunteer_pickup(db, volunteer_user_id, match.id)
            match.volunteer_notified = True

    donation.match_details = {
        "match_id": match.id if match else None,
        "ngo_id": selected_ngo.id if selected_ngo_id and selected_ngo else (matches[0].get("ngo_id") if matches else None),
        "ngo_name": selected_ngo.organization_name if selected_ngo_id and selected_ngo else (matches[0].get("ngo_name") if matches else None),
        "volunteer_id": volunteer_assignment.get("id") if volunteer_assignment else None,
        "status": match.status if match else donation.status,
        "ngo_accepted": match.ngo_accepted if match else False,
        "volunteer_accepted": match.volunteer_accepted if match else False,
        "distance_km": match.distance_km if match else None,
        "estimated_delivery_time": match.estimated_delivery_time if match else None,
    }

    return donation


@router.get("/", summary="List all donations (paginated)")
async def list_donations(
    skip: int = 0, limit: int = 20, status: Optional[str] = None,
    current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    query = select(FoodDonation)
    if current_user.role == "donor":
        result = await db.execute(select(Donor).where(Donor.user_id == current_user.id))
        donor = result.scalar_one_or_none()
        if donor:
            query = query.where(FoodDonation.donor_id == donor.id)
    if status:
        query = query.where(FoodDonation.status == status)
    query = query.offset(skip).limit(limit).order_by(FoodDonation.created_at.desc())
    result = await db.execute(query)
    donations = result.scalars().all()

    enriched = []
    for donation in donations:
        match_result = await db.execute(
            select(Match).where(Match.donation_id == donation.id).order_by(Match.created_at.desc()).limit(1)
        )
        match = match_result.scalar_one_or_none()
        if match:
            ngo_result = await db.execute(select(NGO).where(NGO.id == match.ngo_id))
            ngo = ngo_result.scalar_one_or_none()
            donation.match_details = {
                "match_id": match.id,
                "ngo_id": match.ngo_id,
                "ngo_name": ngo.organization_name if ngo else None,
                "volunteer_id": match.volunteer_id,
                "status": match.status,
                "ngo_accepted": match.ngo_accepted,
                "volunteer_accepted": match.volunteer_accepted,
                "distance_km": match.distance_km,
                "estimated_delivery_time": match.estimated_delivery_time,
            }
        enriched.append(donation)
    return enriched


@router.get("/{donation_id}", summary="Get donation details")
async def get_donation(
    donation_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(FoodDonation).where(FoodDonation.id == donation_id))
    donation = result.scalar_one_or_none()
    if not donation:
        raise HTTPException(404, "Donation not found")

    match_result = await db.execute(
        select(Match).where(Match.donation_id == donation.id).order_by(Match.created_at.desc()).limit(1)
    )
    match = match_result.scalar_one_or_none()
    if match:
        ngo_result = await db.execute(select(NGO).where(NGO.id == match.ngo_id))
        ngo = ngo_result.scalar_one_or_none()
        donation.match_details = {
            "match_id": match.id,
            "ngo_id": match.ngo_id,
            "ngo_name": ngo.organization_name if ngo else None,
            "volunteer_id": match.volunteer_id,
            "status": match.status,
            "ngo_accepted": match.ngo_accepted,
            "volunteer_accepted": match.volunteer_accepted,
            "distance_km": match.distance_km,
            "estimated_delivery_time": match.estimated_delivery_time,
        }

    return donation


@router.post("/{donation_id}/upload-image", summary="Upload food image")
async def upload_food_image(
    donation_id: int,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(FoodDonation).where(FoodDonation.id == donation_id))
    donation = result.scalar_one_or_none()
    if not donation:
        raise HTTPException(404, "Donation not found")

    # Save image
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)

    donation.image_url = f"/uploads/{filename}"
    await db.flush()
    return {"image_url": donation.image_url, "message": "Image uploaded successfully"}
