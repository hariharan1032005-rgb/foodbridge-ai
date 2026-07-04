"""
Shelf Life Prediction Agent
- Predicts remaining shelf life
- Calculates spoilage risk
- Assigns pickup priority
"""
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

from datetime import datetime
from app.core.config import settings
import json
import re

if GENAI_AVAILABLE and settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


class ShelfLifePredictionAgent:
    def __init__(self):
        if GENAI_AVAILABLE:
            self.model = genai.GenerativeModel("gemini-1.5-flash")
        else:
            self.model = None
        self.name = "Shelf Life Prediction Agent"

    async def predict(self, food_data: dict, analysis: dict = None) -> dict:
        """Predict shelf life and spoilage risk."""
        now = datetime.utcnow()
        expires_at_str = food_data.get("expires_at", "")
        prepared_at_str = food_data.get("prepared_at", "")

        # Calculate basic time metrics
        hours_until_expiry = 24  # default
        try:
            if expires_at_str:
                if isinstance(expires_at_str, str):
                    expires_at = datetime.fromisoformat(expires_at_str.replace("Z", ""))
                else:
                    expires_at = expires_at_str
                hours_until_expiry = (expires_at - now).total_seconds() / 3600
        except Exception:
            pass

        prompt = f"""
You are a food shelf life and spoilage prediction AI.

Food Information:
- Name: {food_data.get('food_name', 'Unknown')}
- Category: {food_data.get('food_category', 'Unknown')}
- Hours Until Expiry: {hours_until_expiry:.1f} hours
- Prepared At: {prepared_at_str}
- Freshness Score: {analysis.get('freshness_score', 70) if analysis else 70}/100
- Quality Score: {analysis.get('quality_score', 70) if analysis else 70}/100

Predict in this EXACT JSON format (raw JSON only):
{{
  "remaining_shelf_life_hours": number,
  "spoilage_risk": "low/medium/high/critical",
  "pickup_priority": "normal/urgent/critical",
  "optimal_pickup_window_hours": number,
  "temperature_recommendation": "string",
  "spoilage_probability": number between 0-100,
  "risk_factors": ["list of risk factors"],
  "recommendation": "string with specific action to take"
}}
"""
        try:
            response = self.model.generate_content(prompt)
            text = re.sub(r'```json|```', '', response.text).strip()
            result = json.loads(text)
            return {
                "agent": self.name,
                "status": "success",
                "prediction": result
            }
        except Exception as e:
            # Rule-based fallback
            if hours_until_expiry <= 2:
                risk, priority = "critical", "critical"
            elif hours_until_expiry <= 6:
                risk, priority = "high", "urgent"
            elif hours_until_expiry <= 12:
                risk, priority = "medium", "urgent"
            else:
                risk, priority = "low", "normal"

            return {
                "agent": self.name,
                "status": "fallback",
                "prediction": {
                    "remaining_shelf_life_hours": max(0, hours_until_expiry),
                    "spoilage_risk": risk,
                    "pickup_priority": priority,
                    "optimal_pickup_window_hours": min(hours_until_expiry * 0.6, 4),
                    "temperature_recommendation": "Store at 4°C or below",
                    "spoilage_probability": max(0, min(100, 100 - hours_until_expiry * 4)),
                    "risk_factors": ["Time-sensitive food", "Monitor temperature"],
                    "recommendation": f"Pickup within {max(1, hours_until_expiry * 0.5):.1f} hours for best quality"
                },
                "error": str(e)
            }
