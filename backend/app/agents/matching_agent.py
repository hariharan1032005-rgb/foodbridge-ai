"""
Smart Matching Agent
- Matches donors with best NGOs
- Uses: Distance, Quantity, Food Category, Shelf Life, NGO Capacity, Urgency
- Generates matching score and explanation
"""
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

from app.core.config import settings
import json
import re
import math

if GENAI_AVAILABLE and settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates in km."""
    R = 6371  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class SmartMatchingAgent:
    def __init__(self):
        if GENAI_AVAILABLE:
            self.model = genai.GenerativeModel("gemini-1.5-flash")
        else:
            self.model = None
        self.name = "Smart Matching Agent"

    def _calculate_base_score(self, donation: dict, ngo: dict, distance_km: float) -> float:
        """Calculate rule-based matching score (0-100)."""
        score = 100.0

        # Distance penalty (max 25 pts deduction)
        if distance_km > 50:
            score -= 25
        elif distance_km > 20:
            score -= 15
        elif distance_km > 10:
            score -= 8
        elif distance_km > 5:
            score -= 3

        # Capacity check (max 20 pts deduction)
        ngo_capacity = ngo.get("capacity", 50)
        donation_servings = donation.get("quantity_servings", 50)
        if donation_servings and donation_servings > ngo_capacity:
            score -= 20

        # Category preference (max 15 pts deduction)
        preferred = ngo.get("preferred_food_categories", [])
        if preferred and donation.get("food_category") not in preferred:
            score -= 15

        # Veg/non-veg compatibility
        if not ngo.get("accepts_nonveg", True) and not donation.get("is_veg", True):
            score -= 30

        # Urgency boost
        if donation.get("pickup_priority") in ["urgent", "critical"]:
            score += 5

        # Demand alignment
        current_demand = ngo.get("current_demand", 0)
        if current_demand > 0:
            score += 5

        return max(0, min(100, score))

    async def match(self, donation: dict, ngos: list) -> list:
        """Find and rank best NGO matches for a donation."""
        ranked = []

        for ngo in ngos:
            # Calculate distance
            distance_km = 10.0  # default
            if all([
                donation.get("pickup_latitude"), donation.get("pickup_longitude"),
                ngo.get("latitude"), ngo.get("longitude")
            ]):
                distance_km = haversine_distance(
                    donation["pickup_latitude"], donation["pickup_longitude"],
                    ngo["latitude"], ngo["longitude"]
                )

            base_score = self._calculate_base_score(donation, ngo, distance_km)
            estimated_time = int(distance_km * 3 + 15)  # rough estimate in minutes

            ranked.append({
                "ngo_id": ngo.get("id"),
                "ngo_name": ngo.get("organization_name"),
                "distance_km": round(distance_km, 2),
                "matching_score": round(base_score, 1),
                "estimated_delivery_time": estimated_time,
            })

        # Sort by score descending
        ranked.sort(key=lambda x: x["matching_score"], reverse=True)

        # Get AI explanation for top match
        if ranked:
            top = ranked[0]
            top["ai_explanation"] = await self._get_explanation(donation, ngos, top)

        return ranked[:5]  # Return top 5

    async def _get_explanation(self, donation: dict, ngos: list, match: dict) -> str:
        """Generate AI explanation for the best match."""
        ngo_info = next((n for n in ngos if n.get("id") == match.get("ngo_id")), {})

        prompt = f"""
You are an AI explaining why this NGO was matched with this food donation.
Be concise and helpful (2-3 sentences max).

Donation: {donation.get('food_name')} - {donation.get('quantity_kg')}kg
NGO: {ngo_info.get('organization_name')} - capacity {ngo_info.get('capacity')} people
Distance: {match.get('distance_km')} km
Score: {match.get('matching_score')}/100
Priority: {donation.get('pickup_priority', 'normal')}

Explain in 2-3 sentences why this NGO is the best match. Be specific and practical.
"""
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception:
            return (
                f"{ngo_info.get('organization_name', 'This NGO')} was selected as the best match "
                f"with a compatibility score of {match.get('matching_score')}/100. "
                f"It is located {match.get('distance_km')} km away and has sufficient capacity "
                f"to receive this donation."
            )
