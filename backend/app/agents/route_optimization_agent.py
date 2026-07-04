"""
Route Optimization Agent
- Finds shortest pickup route using OpenStreetMap (OSRM)
- Estimates delivery time
- Assigns volunteer based on proximity
"""
import httpx
import math
from typing import Optional

OSRM_API = "http://router.project-osrm.org/route/v1/driving"


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class RouteOptimizationAgent:
    def __init__(self):
        self.name = "Route Optimization Agent"

    async def get_route(
        self,
        pickup_lat: float, pickup_lon: float,
        delivery_lat: float, delivery_lon: float
    ) -> dict:
        """Get optimized route from pickup to delivery using OSRM."""
        try:
            url = f"{OSRM_API}/{pickup_lon},{pickup_lat};{delivery_lon},{delivery_lat}"
            params = {"overview": "full", "geometries": "geojson", "steps": "true"}

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                data = response.json()

            if data.get("code") == "Ok" and data.get("routes"):
                route = data["routes"][0]
                distance_m = route["distance"]
                duration_s = route["duration"]

                return {
                    "agent": self.name,
                    "status": "success",
                    "source": "osrm",
                    "distance_km": round(distance_m / 1000, 2),
                    "duration_minutes": int(duration_s / 60),
                    "geometry": route.get("geometry"),
                    "instructions": self._parse_steps(route),
                }
        except Exception as e:
            pass

        # Fallback: Haversine estimate
        direct_km = haversine_distance(pickup_lat, pickup_lon, delivery_lat, delivery_lon)
        road_factor = 1.4  # roads are ~40% longer than straight line
        est_km = direct_km * road_factor
        est_minutes = int(est_km * 3 + 10)  # ~20 km/h urban speed + 10 min buffer

        return {
            "agent": self.name,
            "status": "estimated",
            "source": "haversine",
            "distance_km": round(est_km, 2),
            "duration_minutes": est_minutes,
            "geometry": None,
            "instructions": [f"Drive approximately {est_km:.1f} km to destination"]
        }

    def _parse_steps(self, route: dict) -> list:
        """Parse OSRM route steps into human-readable instructions."""
        steps = []
        for leg in route.get("legs", []):
            for step in leg.get("steps", []):
                maneuver = step.get("maneuver", {})
                instruction = f"{maneuver.get('type', 'continue').title()} on {step.get('name', 'road')}"
                distance = step.get("distance", 0)
                if distance > 0:
                    instruction += f" for {distance/1000:.1f} km"
                steps.append(instruction)
        return steps[:10]  # Limit to 10 steps

    async def assign_volunteer(self, volunteers: list, pickup_lat: float, pickup_lon: float) -> Optional[dict]:
        """Assign the nearest available volunteer."""
        if not volunteers:
            return None

        closest = None
        min_dist = float("inf")

        for volunteer in volunteers:
            v_lat = volunteer.get("latitude", 0) or 0
            v_lon = volunteer.get("longitude", 0) or 0
            if not v_lat or not v_lon:
                continue
            dist = haversine_distance(pickup_lat, pickup_lon, v_lat, v_lon)
            if dist < min_dist:
                min_dist = dist
                closest = {**volunteer, "distance_to_pickup_km": round(dist, 2)}

        return closest
