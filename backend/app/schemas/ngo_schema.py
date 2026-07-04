from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class NGOProfileCreate(BaseModel):
    organization_name: str
    registration_number: Optional[str] = None
    ngo_type: str
    address: str
    city: str
    state: str
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: int = 50
    preferred_food_categories: Optional[List[str]] = []
    accepts_nonveg: bool = True
    operating_hours_start: str = "08:00"
    operating_hours_end: str = "20:00"


class NGOProfileResponse(NGOProfileCreate):
    id: int
    user_id: int
    current_demand: int
    total_received: int
    rating: float
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class FoodRequestCreate(BaseModel):
    required_quantity_kg: float
    required_servings: Optional[int] = None
    preferred_categories: Optional[List[str]] = []
    required_by: Optional[datetime] = None
    is_urgent: bool = False
    notes: Optional[str] = None


class FoodRequestResponse(FoodRequestCreate):
    id: int
    ngo_id: int
    is_fulfilled: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MatchResponse(BaseModel):
    id: int
    donation_id: int
    ngo_id: int
    volunteer_id: Optional[int] = None
    matching_score: Optional[float] = None
    distance_km: Optional[float] = None
    estimated_delivery_time: Optional[int] = None
    ai_explanation: Optional[str] = None
    status: str
    ngo_accepted: bool
    created_at: datetime

    class Config:
        from_attributes = True
