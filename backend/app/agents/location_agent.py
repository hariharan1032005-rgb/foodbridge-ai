"""
Location Suggestion Agent
- Uses Gemini to suggest complete addresses from partial pickup address input
- Returns structured suggestions including optional geocoordinates
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


class LocationSuggestionAgent:
    def __init__(self):
        if GENAI_AVAILABLE and settings.GEMINI_API_KEY:
            self.model = genai.GenerativeModel("gemini-1.5-flash")
        else:
            self.model = None
        self.name = "Location Suggestion Agent"

    async def suggest(self, query: str) -> list:
        """Return address suggestions for a partial location query."""
        if not query or len(query.strip()) < 3:
            return []

        prompt = f"""
You are a helpful assistant that completes partial pickup address input into up to 5 valid address suggestions.
Return raw JSON only in this exact format:
[
  {
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "latitude": number,
    "longitude": number
  }
]

Partial address input: "{query}"
If you cannot infer coordinates precisely, return 0 for latitude and longitude.
Do not include any markdown or explanation.
"""
        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            text = re.sub(r'```json|```', '', text).strip()
            suggestions = json.loads(text)
            if isinstance(suggestions, list):
                return [
                    {
                        "address": item.get("address", ""),
                        "city": item.get("city", ""),
                        "state": item.get("state", ""),
                        "country": item.get("country", ""),
                        "latitude": float(item.get("latitude") or 0),
                        "longitude": float(item.get("longitude") or 0),
                    }
                    for item in suggestions
                ]
        except Exception:
            pass

        # Fallback: return the raw query as a single suggestion
        return [{
            "address": query.strip(),
            "city": "",
            "state": "",
            "country": "",
            "latitude": 0,
            "longitude": 0,
        }]
