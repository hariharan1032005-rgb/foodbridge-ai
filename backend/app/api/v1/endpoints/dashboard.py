from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import FoodDonation, Match, Donor, NGO, Volunteer, User, DonationStatus
from app.agents.analytics_agent import AnalyticsAgent
from app.agents.recommendation_agent import RecommendationAgent

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
analytics_agent = AnalyticsAgent()
recommendation_agent = RecommendationAgent()


@router.get("/stats", summary="Get platform dashboard statistics")
async def get_dashboard_stats(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Count totals
    total_donations = await db.scalar(select(func.count(FoodDonation.id)))
    total_donors = await db.scalar(select(func.count(Donor.id)))
    total_ngos = await db.scalar(select(func.count(NGO.id)))
    total_volunteers = await db.scalar(select(func.count(Volunteer.id)))

    pending_pickups = await db.scalar(
        select(func.count(FoodDonation.id)).where(
            FoodDonation.status.in_([DonationStatus.MATCHED, DonationStatus.ASSIGNED])
        )
    )
    successful_deliveries = await db.scalar(
        select(func.count(Match.id)).where(Match.status == DonationStatus.DELIVERED)
    )

    # Total food donated
    total_kg_result = await db.scalar(
        select(func.sum(FoodDonation.quantity_kg)).where(
            FoodDonation.status == DonationStatus.DELIVERED
        )
    )
    total_kg = float(total_kg_result or 0)

    # Calculate impact
    impact = analytics_agent.calculate_impact(total_kg, successful_deliveries or 0)

    return {
        "overview": {
            "total_donations": total_donations or 0,
            "total_donors": total_donors or 0,
            "active_ngos": total_ngos or 0,
            "active_volunteers": total_volunteers or 0,
            "pending_pickups": pending_pickups or 0,
            "successful_deliveries": successful_deliveries or 0,
        },
        "impact": impact,
        "generated_at": "now"
    }


@router.get("/analytics", summary="Get full AI analytics")
async def get_analytics(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch data
    donations_result = await db.execute(select(FoodDonation))
    donations = donations_result.scalars().all()
    donation_dicts = [
        {"id": d.id, "food_category": d.food_category, "quantity_kg": d.quantity_kg,
         "is_veg": d.is_veg, "status": d.status,
         "created_at": d.created_at.isoformat() if d.created_at else None}
        for d in donations
    ]

    matches_result = await db.execute(select(Match))
    matches = matches_result.scalars().all()
    match_dicts = [
        {"id": m.id, "ngo_id": m.ngo_id, "volunteer_id": m.volunteer_id,
         "ngo_accepted": m.ngo_accepted, "delivered_at": str(m.delivered_at) if m.delivered_at else None}
        for m in matches
    ]

    ngos_result = await db.execute(select(NGO))
    ngos = ngos_result.scalars().all()
    ngo_dicts = [{"id": n.id, "organization_name": n.organization_name, "rating": n.rating} for n in ngos]

    volunteers_result = await db.execute(select(Volunteer))
    volunteers = volunteers_result.scalars().all()
    vol_dicts = [{"id": v.id, "rating": v.rating, "full_name": f"Volunteer #{v.id}"} for v in volunteers]

    total_kg = sum(d.get("quantity_kg", 0) for d in donation_dicts)
    delivered_count = sum(1 for m in match_dicts if m.get("delivered_at"))

    impact = analytics_agent.calculate_impact(total_kg, delivered_count)
    trends = analytics_agent.generate_donation_trends(donation_dicts)
    ngo_perf = analytics_agent.ngo_performance(ngo_dicts, match_dicts)
    vol_perf = analytics_agent.volunteer_performance(vol_dicts, match_dicts)

    ai_insights = await recommendation_agent.generate_insights(impact)

    return {
        "impact": impact,
        "trends": trends,
        "ngo_performance": ngo_perf[:10],
        "volunteer_performance": vol_perf[:10],
        "ai_insights": ai_insights
    }


@router.get("/notifications", summary="Get user notifications")
async def get_notifications(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.models import Notification
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


@router.patch("/notifications/{notification_id}/read", summary="Mark notification as read")
async def mark_notification_read(
    notification_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.models import Notification
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(404, "Notification not found")
    notif.is_read = True
    return {"message": "Marked as read"}
