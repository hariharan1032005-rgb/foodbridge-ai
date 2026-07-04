"""
Recommendation Agent
- Recommends best NGO for a donation
- Recommends best pickup time
- Provides AI-powered explanations
"""
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

from app.core.config import settings
import json
import re
from datetime import datetime, timedelta

if GENAI_AVAILABLE and settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


class RecommendationAgent:
    def __init__(self):
        if GENAI_AVAILABLE:
            self.model = genai.GenerativeModel("gemini-1.5-flash")
        else:
            self.model = None
        self.name = "Recommendation Agent"

    async def recommend_pickup_time(self, donation: dict, shelf_life: dict) -> dict:
        """Recommend optimal pickup time window."""
        remaining_hours = shelf_life.get("remaining_shelf_life_hours", 24)
        priority = shelf_life.get("pickup_priority", "normal")

        if priority == "critical":
            pickup_in = 0.5
            window = 1
        elif priority == "urgent":
            pickup_in = 1
            window = 2
        else:
            pickup_in = max(1, remaining_hours * 0.2)
            window = min(4, remaining_hours * 0.3)

        pickup_start = datetime.utcnow() + timedelta(hours=pickup_in)
        pickup_end = pickup_start + timedelta(hours=window)

        return {
            "recommended_pickup_start": pickup_start.isoformat(),
            "recommended_pickup_end": pickup_end.isoformat(),
            "pickup_in_hours": round(pickup_in, 1),
            "window_hours": round(window, 1),
            "reason": f"Based on {remaining_hours:.1f}h remaining shelf life with {priority} priority"
        }

    async def recommend_ngo(self, matches: list, donation: dict) -> dict:
        """Provide AI recommendation for NGO selection."""
        if not matches:
            return {"recommendation": "No NGOs available", "reason": "No matches found"}

        top_match = matches[0]
        prompt = f"""
As an AI food redistribution advisor, explain your top NGO recommendation.

Donation: {donation.get('food_name')} - {donation.get('quantity_kg')}kg ({donation.get('food_category')})
Top Recommended NGO: {top_match.get('ngo_name')}
Score: {top_match.get('matching_score')}/100
Distance: {top_match.get('distance_km')} km
Estimated Delivery: {top_match.get('estimated_delivery_time')} minutes

In 2-3 sentences, explain why this is the optimal choice considering food safety, social impact, and logistics.
Return only plain text, no JSON, no markdown.
"""
        try:
            response = self.model.generate_content(prompt)
            explanation = response.text.strip()
        except Exception:
            explanation = (
                f"{top_match.get('ngo_name')} is the optimal choice with a {top_match.get('matching_score')}/100 "
                f"compatibility score. Located just {top_match.get('distance_km')} km away, "
                f"it can ensure timely food delivery within {top_match.get('estimated_delivery_time')} minutes."
            )

        return {
            "recommended_ngo_id": top_match.get("ngo_id"),
            "recommended_ngo_name": top_match.get("ngo_name"),
            "matching_score": top_match.get("matching_score"),
            "ai_explanation": explanation,
            "all_matches": matches
        }

    async def generate_insights(self, analytics: dict) -> dict:
        """Generate AI-powered platform insights."""
        prompt = f"""
Based on these FoodBridge AI platform metrics, generate actionable insights:

Metrics:
- Total Meals Saved: {analytics.get('meals_saved', 0)}
- Total Food Redistributed: {analytics.get('total_kg_redistributed', 0)} kg
- Carbon Footprint Saved: {analytics.get('carbon_footprint_saved_kg', 0)} kg CO2
- Total Deliveries: {analytics.get('total_deliveries', 0)}

Return ONLY raw JSON:
{{
  "key_insight": "Most impactful finding",
  "improvement_areas": ["area1", "area2", "area3"],
  "success_message": "Congratulatory message for the team",
  "next_goals": ["goal1", "goal2"]
}}
"""
        try:
            response = self.model.generate_content(prompt)
            text = re.sub(r'```json|```', '', response.text).strip()
            return json.loads(text)
        except Exception:
            return {
                "key_insight": f"Platform has saved {analytics.get('meals_saved', 0)} meals so far!",
                "improvement_areas": ["Expand volunteer network", "Add more NGO partners", "Increase donor outreach"],
                "success_message": "Amazing work! Your platform is making a real difference in reducing food waste.",
                "next_goals": ["Reach 10,000 meals saved", "Partner with 50+ NGOs"]
            }
