from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os, json, csv, io
from datetime import datetime

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import FoodDonation, Match, NGO, Donor, DonationStatus, Report
from app.core.config import settings

router = APIRouter(prefix="/reports", tags=["Reports"])


async def _get_report_data(db: AsyncSession) -> dict:
    donations = (await db.execute(select(FoodDonation))).scalars().all()
    matches = (await db.execute(select(Match))).scalars().all()
    ngos = (await db.execute(select(NGO))).scalars().all()

    total_kg = sum((d.quantity_kg or 0) for d in donations)
    delivered = sum(1 for m in matches if m.status == DonationStatus.DELIVERED)

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "summary": {
            "total_donations": len(donations),
            "total_ngos": len(ngos),
            "total_matches": len(matches),
            "delivered_count": delivered,
            "total_kg_donated": round(total_kg, 2),
            "meals_saved": int(total_kg / 0.4),
            "carbon_saved_kg": round(total_kg * 2.5, 2),
        },
        "donations": [
            {
                "id": d.id, "food_name": d.food_name, "category": str(d.food_category),
                "quantity_kg": d.quantity_kg, "is_veg": d.is_veg,
                "status": str(d.status), "created_at": str(d.created_at)
            }
            for d in donations[:100]
        ]
    }


@router.get("/donation", summary="Generate donation report")
async def donation_report(
    format: str = Query("json", description="json, csv"),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    data = await _get_report_data(db)

    if format == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["id", "food_name", "category", "quantity_kg", "status", "created_at"])
        writer.writeheader()
        writer.writerows(data["donations"])
        output.seek(0)

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        filepath = os.path.join(settings.UPLOAD_DIR, f"donation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
        with open(filepath, "w") as f:
            f.write(output.getvalue())
        return FileResponse(filepath, media_type="text/csv", filename="donation_report.csv")

    return data


@router.get("/analytics", summary="Generate analytics report")
async def analytics_report(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.agents.analytics_agent import AnalyticsAgent
    agent = AnalyticsAgent()
    data = await _get_report_data(db)
    impact = agent.calculate_impact(data["summary"]["total_kg_donated"], data["summary"]["delivered_count"])

    return {
        "report_title": "FoodBridge AI - Analytics Report",
        "generated_at": data["generated_at"],
        "summary": data["summary"],
        "impact_metrics": impact,
        "platform_highlights": [
            f"Saved {impact['meals_saved']} meals from going to waste",
            f"Fed {impact['people_fed']} people in need",
            f"Prevented {impact['carbon_footprint_saved_kg']} kg of CO2 emissions",
            f"Equivalent to planting {impact['equivalent_trees_planted']} trees"
        ]
    }
