"""
Notification Agent
- Sends notifications to donors, NGOs, and volunteers
- Supports in-app notifications (stored in DB)
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert
from app.models.models import Notification
from datetime import datetime


class NotificationAgent:
    def __init__(self):
        self.name = "Notification Agent"

    async def notify(self, db: AsyncSession, user_id: int, title: str, message: str,
                     notification_type: str, related_id: int = None):
        """Create an in-app notification."""
        try:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                related_id=related_id,
                is_read=False
            )
            db.add(notification)
            await db.flush()
            return {"status": "success", "notification_id": notification.id}
        except Exception as e:
            return {"status": "failed", "error": str(e)}

    async def notify_donation_posted(self, db: AsyncSession, donor_user_id: int, donation_id: int):
        return await self.notify(
            db, donor_user_id,
            "✅ Donation Posted Successfully",
            "Your food donation has been posted and is being analyzed by our AI system.",
            "donation", donation_id
        )

    async def notify_match_found(self, db: AsyncSession, donor_user_id: int, ngo_name: str, donation_id: int):
        return await self.notify(
            db, donor_user_id,
            "🎯 Match Found!",
            f"Your donation has been matched with {ngo_name}. A volunteer will be assigned soon.",
            "match", donation_id
        )

    async def notify_ngo_donation(self, db: AsyncSession, ngo_user_id: int, food_name: str, match_id: int):
        return await self.notify(
            db, ngo_user_id,
            "🍱 New Food Donation Available",
            f"A donation of '{food_name}' has been matched to your NGO. Please confirm acceptance.",
            "match", match_id
        )

    async def notify_volunteer_pickup(self, db: AsyncSession, volunteer_user_id: int, match_id: int):
        return await self.notify(
            db, volunteer_user_id,
            "🚗 New Pickup Assignment",
            "You have been assigned a new food pickup. Please check your volunteer portal for details.",
            "pickup", match_id
        )

    async def notify_donor_accepted(self, db: AsyncSession, donor_user_id: int, ngo_name: str, match_id: int):
        return await self.notify(
            db, donor_user_id,
            "✅ Donation Accepted by NGO",
            f"Your donation has been accepted by {ngo_name}. Pickup will begin shortly.",
            "match", match_id
        )

    async def notify_delivery_complete(self, db: AsyncSession, donor_user_id: int, ngo_name: str, match_id: int):
        return await self.notify(
            db, donor_user_id,
            "🎉 Delivery Completed!",
            f"Your food donation has been successfully delivered to {ngo_name}. Thank you for making a difference!",
            "delivery", match_id
        )
