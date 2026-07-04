"""
Food Analysis Agent
- Analyzes donated food using Gemini AI
- Detects category, veg/non-veg status
- Estimates freshness and generates quality score
"""
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

from app.core.config import settings
import json
import re

if GENAI_AVAILABLE and settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


class FoodAnalysisAgent:
    def __init__(self):
        if GENAI_AVAILABLE:
            self.model = genai.GenerativeModel("gemini-1.5-flash")
        else:
            self.model = None
        self.name = "Food Analysis Agent"

    async def analyze(self, food_data: dict) -> dict:
        """Analyze food donation and return quality assessment."""
        prompt = f"""
You are a food safety and quality analysis AI agent.
Analyze the following food donation and provide a comprehensive assessment.

Food Details:
- Name: {food_data.get('food_name', 'Unknown')}
- Category: {food_data.get('food_category', 'Unknown')}
- Quantity: {food_data.get('quantity_kg', 0)} kg
- Prepared At: {food_data.get('prepared_at', 'Unknown')}
- Expires At: {food_data.get('expires_at', 'Unknown')}
- Description: {food_data.get('description', 'Not provided')}

Provide analysis in this EXACT JSON format (no markdown, no code blocks, just raw JSON):
{{
  "food_category_detected": "string (cooked_meal/raw_vegetables/fruits/bakery/dairy/grains/beverages/snacks/other)",
  "is_veg": true or false,
  "freshness_score": number between 0-100,
  "quality_score": number between 0-100,
  "category_confidence": number between 0-100,
  "nutritional_value": "low/medium/high",
  "suitable_for": ["orphanage", "old-age-home", "shelter"],
  "storage_conditions": "string",
  "safety_notes": "string",
  "ai_summary": "2-3 sentence summary of food quality and suitability"
}}
"""
        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            # Clean up response
            text = re.sub(r'```json|```', '', text).strip()
            result = json.loads(text)
            return {
                "agent": self.name,
                "status": "success",
                "analysis": result
            }
        except Exception as e:
            # Fallback analysis
            return {
                "agent": self.name,
                "status": "fallback",
                "analysis": {
                    "food_category_detected": food_data.get("food_category", "other"),
                    "is_veg": food_data.get("is_veg", True),
                    "freshness_score": 75.0,
                    "quality_score": 70.0,
                    "category_confidence": 80.0,
                    "nutritional_value": "medium",
                    "suitable_for": ["orphanage", "shelter"],
                    "storage_conditions": "Store in cool, dry place",
                    "safety_notes": "Standard food safety guidelines apply",
                    "ai_summary": f"Food donation of {food_data.get('food_name', 'food')} analyzed. Quality appears acceptable for distribution."
                },
                "error": str(e)
            }

    async def analyze_with_image(self, food_data: dict, image_path: str) -> dict:
        """Analyze food with image using Gemini Vision."""
        try:
            import PIL.Image
            img = PIL.Image.open(image_path)
            prompt = f"""
Analyze this food image and the following details:
- Name: {food_data.get('food_name', 'Unknown')}
- Description: {food_data.get('description', 'Not provided')}

Provide JSON analysis with: food_category_detected, is_veg (bool), freshness_score (0-100),
quality_score (0-100), visual_appeal (0-100), contamination_risk (low/medium/high),
ai_summary (string).
Return ONLY raw JSON, no markdown.
"""
            response = self.model.generate_content([prompt, img])
            text = re.sub(r'```json|```', '', response.text).strip()
            return {"agent": self.name, "status": "success", "analysis": json.loads(text)}
        except Exception as e:
            return await self.analyze(food_data)
