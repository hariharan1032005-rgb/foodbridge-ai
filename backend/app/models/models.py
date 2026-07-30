import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, Enum, JSON
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DONOR = "donor"
    NGO = "ngo"
    VOLUNTEER = "volunteer"


class DonationStatus(str, enum.Enum):
    PENDING = "pending"
    MATCHED = "matched"
    ASSIGNED = "assigned"
    ACCEPTED = "accepted"
    PICKED_UP = "picked_up"
    DELIVERED = "delivered"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class FoodCategory(str, enum.Enum):
    COOKED_MEAL = "cooked_meal"
    RAW_VEGETABLES = "raw_vegetables"
    FRUITS = "fruits"
    BAKERY = "bakery"
    DAIRY = "dairy"
    GRAINS = "grains"
    BEVERAGES = "beverages"
    SNACKS = "snacks"
    OTHER = "other"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20))
    role = Column(Enum(UserRole), nullable=False, default=UserRole.DONOR)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    otp_code = Column(String(10))
    otp_sent_at = Column(DateTime)
    profile_image = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    donor_profile = relationship("Donor", back_populates="user", uselist=False)
    ngo_profile = relationship("NGO", back_populates="user", uselist=False)
    volunteer_profile = relationship("Volunteer", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")


class Donor(Base):
    __tablename__ = "donors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    organization_name = Column(String(255))
    organization_type = Column(String(100))  # restaurant, hotel, individual, etc.
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    latitude = Column(Float)
    longitude = Column(Float)
    total_donations = Column(Integer, default=0)
    total_meals_donated = Column(Integer, default=0)
    rating = Column(Float, default=5.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="donor_profile")
    donations = relationship("FoodDonation", back_populates="donor")


class NGO(Base):
    __tablename__ = "ngos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    organization_name = Column(String(255), nullable=False)
    registration_number = Column(String(100))
    ngo_type = Column(String(100))  # orphanage, old-age-home, shelter
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    latitude = Column(Float)
    longitude = Column(Float)
    capacity = Column(Integer, default=50)  # people they can feed
    current_demand = Column(Integer, default=0)
    preferred_food_categories = Column(JSON, default=list)
    accepts_nonveg = Column(Boolean, default=True)
    operating_hours_start = Column(String(10), default="08:00")
    operating_hours_end = Column(String(10), default="20:00")
    total_received = Column(Integer, default=0)
    rating = Column(Float, default=5.0)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="ngo_profile")
    food_requests = relationship("FoodRequest", back_populates="ngo")
    matches = relationship("Match", back_populates="ngo")


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    vehicle_type = Column(String(50))  # bike, car, van
    vehicle_number = Column(String(20))
    address = Column(Text)
    city = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    is_available = Column(Boolean, default=True)
    total_pickups = Column(Integer, default=0)
    rating = Column(Float, default=5.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="volunteer_profile")
    matches = relationship("Match", back_populates="volunteer")


class FoodDonation(Base):
    __tablename__ = "food_donations"

    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("donors.id"), nullable=False)
    food_name = Column(String(255), nullable=False)
    food_category = Column(Enum(FoodCategory), nullable=False)
    is_veg = Column(Boolean, default=True)
    quantity_kg = Column(Float, nullable=False)
    quantity_servings = Column(Integer)
    pickup_address = Column(Text, nullable=False)
    pickup_latitude = Column(Float)
    pickup_longitude = Column(Float)
    prepared_at = Column(DateTime)
    expires_at = Column(DateTime, nullable=False)
    description = Column(Text)
    image_url = Column(String(500))
    status = Column(Enum(DonationStatus), default=DonationStatus.PENDING)

    # AI Analysis Results
    freshness_score = Column(Float)  # 0-100
    quality_score = Column(Float)    # 0-100
    shelf_life_hours = Column(Float)
    spoilage_risk = Column(String(20))  # low, medium, high
    pickup_priority = Column(String(20))  # normal, urgent, critical
    ai_analysis = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    donor = relationship("Donor", back_populates="donations")
    matches = relationship("Match", back_populates="donation")


class FoodRequest(Base):
    __tablename__ = "food_requests"

    id = Column(Integer, primary_key=True, index=True)
    ngo_id = Column(Integer, ForeignKey("ngos.id"), nullable=False)
    required_quantity_kg = Column(Float, nullable=False)
    required_servings = Column(Integer)
    preferred_categories = Column(JSON, default=list)
    required_by = Column(DateTime)
    is_urgent = Column(Boolean, default=False)
    notes = Column(Text)
    is_fulfilled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ngo = relationship("NGO", back_populates="food_requests")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("food_donations.id"), nullable=False)
    ngo_id = Column(Integer, ForeignKey("ngos.id"), nullable=False)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"))

    matching_score = Column(Float)  # 0-100
    distance_km = Column(Float)
    estimated_delivery_time = Column(Integer)  # minutes
    route_info = Column(JSON)
    ai_explanation = Column(Text)

    donor_notified = Column(Boolean, default=False)
    ngo_notified = Column(Boolean, default=False)
    volunteer_notified = Column(Boolean, default=False)
    volunteer_accepted = Column(Boolean, default=False)

    ngo_accepted = Column(Boolean, default=False)
    pickup_confirmed_at = Column(DateTime)
    delivered_at = Column(DateTime)

    status = Column(Enum(DonationStatus), default=DonationStatus.MATCHED)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    donation = relationship("FoodDonation", back_populates="matches")
    ngo = relationship("NGO", back_populates="matches")
    volunteer = relationship("Volunteer", back_populates="matches")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    ngo_id = Column(Integer, ForeignKey("ngos.id"))
    prediction_type = Column(String(50))  # daily, weekly, festival
    prediction_date = Column(DateTime)
    predicted_demand_kg = Column(Float)
    predicted_servings = Column(Integer)
    confidence_score = Column(Float)
    prediction_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50))  # donation, match, pickup, delivery
    is_read = Column(Boolean, default=False)
    related_id = Column(Integer)  # ID of related entity
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(50))  # donation, ngo, analytics, demand
    title = Column(String(255))
    generated_by = Column(Integer, ForeignKey("users.id"))
    file_path = Column(String(500))
    file_format = Column(String(10))  # pdf, excel, csv
    report_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
