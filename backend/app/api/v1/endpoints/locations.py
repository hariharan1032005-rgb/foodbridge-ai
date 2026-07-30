from fastapi import APIRouter, HTTPException, Query

from app.agents.location_agent import LocationSuggestionAgent

router = APIRouter(prefix="/locations", tags=["Locations"])
agent = LocationSuggestionAgent()


@router.get("/suggest", summary="Suggest pickup addresses for partial query")
async def suggest_address(query: str = Query(..., min_length=3, description="Partial pickup address text")):
    if not agent.model:
        raise HTTPException(
            status_code=503,
            detail="Location suggestion service unavailable. Ensure the Gemini SDK is installed and GEMINI_API_KEY is configured."
        )

    suggestions = await agent.suggest(query)
    return suggestions
