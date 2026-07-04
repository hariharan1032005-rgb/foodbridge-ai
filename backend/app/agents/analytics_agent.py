"""
Analytics Agent
- Generates platform-wide analytics
- Calculates: Meals Saved, Food Waste Prevented, People Fed, Carbon Saved
- Generates donation trends and performance metrics
"""
from datetime import datetime
import math


class AnalyticsAgent:
    def __init__(self):
        self.name = "Analytics Agent"
        # Constants
        self.KG_PER_MEAL = 0.4        # Average kg of food per meal
        self.CO2_PER_KG_FOOD = 2.5    # kg CO2 equivalent per kg food waste
        self.CALORIES_PER_KG = 1200   # avg calories per kg

    def calculate_impact(self, total_kg_donated: float, total_deliveries: int) -> dict:
        """Calculate environmental and social impact."""
        meals_saved = int(total_kg_donated / self.KG_PER_MEAL)
        people_fed = meals_saved  # 1 meal = 1 person
        carbon_saved_kg = total_kg_donated * self.CO2_PER_KG_FOOD
        carbon_saved_trees = carbon_saved_kg / 21.77  # avg tree absorbs ~22kg CO2/year
        calories_provided = int(total_kg_donated * self.CALORIES_PER_KG)

        return {
            "meals_saved": meals_saved,
            "people_fed": people_fed,
            "total_kg_redistributed": round(total_kg_donated, 2),
            "carbon_footprint_saved_kg": round(carbon_saved_kg, 2),
            "equivalent_trees_planted": round(carbon_saved_trees, 1),
            "calories_provided": calories_provided,
            "total_deliveries": total_deliveries,
        }

    def generate_donation_trends(self, donations_data: list) -> dict:
        """Generate donation trend data for charts."""
        # Organize by month
        monthly = {}
        category_stats = {}
        veg_count = 0
        nonveg_count = 0

        for d in donations_data:
            created = d.get("created_at")
            if created:
                if isinstance(created, str):
                    created = datetime.fromisoformat(created[:10])
                month_key = created.strftime("%Y-%m")
                monthly[month_key] = monthly.get(month_key, 0) + d.get("quantity_kg", 0)

            cat = d.get("food_category", "other")
            category_stats[cat] = category_stats.get(cat, 0) + 1

            if d.get("is_veg", True):
                veg_count += 1
            else:
                nonveg_count += 1

        # Sort by month
        sorted_monthly = sorted(monthly.items())

        return {
            "monthly_donations": [
                {"month": k, "kg": round(v, 2)} for k, v in sorted_monthly
            ],
            "category_breakdown": [
                {"category": k, "count": v} for k, v in category_stats.items()
            ],
            "veg_vs_nonveg": {
                "veg": veg_count,
                "non_veg": nonveg_count
            }
        }

    def ngo_performance(self, ngos_data: list, matches_data: list) -> list:
        """Calculate NGO performance metrics."""
        ngo_stats = {}

        for match in matches_data:
            ngo_id = match.get("ngo_id")
            if not ngo_id:
                continue
            if ngo_id not in ngo_stats:
                ngo_stats[ngo_id] = {"received": 0, "accepted": 0, "total_kg": 0}
            ngo_stats[ngo_id]["received"] += 1
            if match.get("ngo_accepted"):
                ngo_stats[ngo_id]["accepted"] += 1

        result = []
        for ngo in ngos_data:
            ngo_id = ngo.get("id")
            stats = ngo_stats.get(ngo_id, {"received": 0, "accepted": 0, "total_kg": 0})
            acceptance_rate = (
                stats["accepted"] / stats["received"] * 100
                if stats["received"] > 0 else 0
            )
            result.append({
                "ngo_id": ngo_id,
                "ngo_name": ngo.get("organization_name"),
                "total_requests_received": stats["received"],
                "total_accepted": stats["accepted"],
                "acceptance_rate": round(acceptance_rate, 1),
                "rating": ngo.get("rating", 5.0)
            })

        return sorted(result, key=lambda x: x["acceptance_rate"], reverse=True)

    def volunteer_performance(self, volunteers_data: list, matches_data: list) -> list:
        """Calculate volunteer performance metrics."""
        vol_stats = {}

        for match in matches_data:
            vol_id = match.get("volunteer_id")
            if not vol_id:
                continue
            if vol_id not in vol_stats:
                vol_stats[vol_id] = {"assigned": 0, "completed": 0}
            vol_stats[vol_id]["assigned"] += 1
            if match.get("delivered_at"):
                vol_stats[vol_id]["completed"] += 1

        result = []
        for vol in volunteers_data:
            vol_id = vol.get("id")
            stats = vol_stats.get(vol_id, {"assigned": 0, "completed": 0})
            completion_rate = (
                stats["completed"] / stats["assigned"] * 100
                if stats["assigned"] > 0 else 0
            )
            result.append({
                "volunteer_id": vol_id,
                "name": vol.get("full_name", "Volunteer"),
                "total_assigned": stats["assigned"],
                "total_completed": stats["completed"],
                "completion_rate": round(completion_rate, 1),
                "rating": vol.get("rating", 5.0)
            })

        return sorted(result, key=lambda x: x["completion_rate"], reverse=True)
