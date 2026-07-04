from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime
from app.models.models import DonationStatus, FoodCategory


class DonorProfileCreate(BaseModel):
    organization_name: Optional[str] = None
    organization_type: Optional[str] = None
    address: str
    city: str
    state: str
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class DonorProfileResponse(DonorProfileCreate):
    id: int
    user_id: int
    total_donations: int
    total_meals_donated: int
    rating: float
    created_at: datetime

    class Config:
        from_attributes = True


class FoodDonationCreate(BaseModel):
    food_name: str
    food_category: FoodCategory
    is_veg: bool = True
    quantity_kg: float
    quantity_servings: Optional[int] = None
    pickup_address: str
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    prepared_at: Optional[datetime] = None
    expires_at: datetime
    description: Optional[str] = None


class FoodDonationResponse(FoodDonationCreate):
    id: int
    donor_id: int
    image_url: Optional[str] = None
    status: DonationStatus
    freshness_score: Optional[float] = None
    quality_score: Optional[float] = None
    shelf_life_hours: Optional[float] = None
    spoilage_risk: Optional[str] = None
    pickup_priority: Optional[str] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FoodDonationUpdate(BaseModel):
    status: Optional[DonationStatus] = None
    description: Optional[str] = None
