"""
LangGraph Multi-Agent Workflow Orchestrator
Coordinates all 8 AI agents for food donation processing
"""
from typing import TypedDict, Optional, Any
import asyncio

from app.agents.food_analysis_agent import FoodAnalysisAgent
from app.agents.shelf_life_agent import ShelfLifePredictionAgent
from app.agents.matching_agent import SmartMatchingAgent
from app.agents.demand_prediction_agent import DemandPredictionAgent
from app.agents.route_optimization_agent import RouteOptimizationAgent
from app.agents.recommendation_agent import RecommendationAgent
from app.agents.analytics_agent import AnalyticsAgent


# ── State Schema ──────────────────────────────────────────────────────────────
class AgentState(TypedDict):
    donation: dict
    ngos: list
    volunteers: list
    food_analysis: Optional[dict]
    shelf_life: Optional[dict]
    matches: Optional[list]
    route: Optional[dict]
    volunteer_assignment: Optional[dict]
    recommendation: Optional[dict]
    notifications_sent: Optional[list]
    error: Optional[str]


# ── Individual Node Functions ─────────────────────────────────────────────────
async def analyze_food_node(state: AgentState) -> AgentState:
    """Node 1: Food Analysis"""
    agent = FoodAnalysisAgent()
    result = await agent.analyze(state["donation"])
    return {**state, "food_analysis": result}


async def predict_shelf_life_node(state: AgentState) -> AgentState:
    """Node 2: Shelf Life Prediction"""
    agent = ShelfLifePredictionAgent()
    analysis = state.get("food_analysis", {}).get("analysis", {})
    result = await agent.predict(state["donation"], analysis)
    return {**state, "shelf_life": result}


async def match_ngos_node(state: AgentState) -> AgentState:
    """Node 3: Smart NGO Matching"""
    agent = SmartMatchingAgent()

    # Enrich donation with AI data
    donation = state["donation"].copy()
    if state.get("shelf_life"):
        prediction = state["shelf_life"].get("prediction", {})
        donation["pickup_priority"] = prediction.get("pickup_priority", "normal")

    matches = await agent.match(donation, state.get("ngos", []))
    return {**state, "matches": matches}


async def optimize_route_node(state: AgentState) -> AgentState:
    """Node 4: Route Optimization"""
    agent = RouteOptimizationAgent()
    matches = state.get("matches", [])
    donation = state["donation"]

    if not matches:
        return {**state, "route": None}

    top_match = matches[0]
    ngos = state.get("ngos", [])
    top_ngo = next((n for n in ngos if n.get("id") == top_match.get("ngo_id")), None)

    if not top_ngo:
        return {**state, "route": None}

    pickup_lat = donation.get("pickup_latitude", 0) or 17.3850
    pickup_lon = donation.get("pickup_longitude", 0) or 78.4867
    delivery_lat = top_ngo.get("latitude", 0) or 17.4065
    delivery_lon = top_ngo.get("longitude", 0) or 78.4772

    route = await agent.get_route(pickup_lat, pickup_lon, delivery_lat, delivery_lon)
    return {**state, "route": route}


async def assign_volunteer_node(state: AgentState) -> AgentState:
    """Node 5: Volunteer Assignment"""
    agent = RouteOptimizationAgent()
    donation = state["donation"]
    pickup_lat = donation.get("pickup_latitude", 0) or 17.3850
    pickup_lon = donation.get("pickup_longitude", 0) or 78.4867
    volunteer = await agent.assign_volunteer(state.get("volunteers", []), pickup_lat, pickup_lon)
    return {**state, "volunteer_assignment": volunteer}


async def generate_recommendation_node(state: AgentState) -> AgentState:
    """Node 6: Recommendation Generation"""
    agent = RecommendationAgent()
    matches = state.get("matches", [])
    donation = state["donation"]
    shelf_life = state.get("shelf_life", {}).get("prediction", {})

    pickup_time = await agent.recommend_pickup_time(donation, shelf_life)
    recommendation = await agent.recommend_ngo(matches, donation)
    recommendation["pickup_time"] = pickup_time

    return {**state, "recommendation": recommendation}


# ── Main Orchestrator ─────────────────────────────────────────────────────────
class FoodBridgeWorkflow:
    """
    Multi-Agent Workflow using sequential async execution.
    Compatible with Python 3.8+ without requiring langgraph installation.
    """

    def __init__(self):
        self.steps = [
            ("Food Analysis", analyze_food_node),
            ("Shelf Life Prediction", predict_shelf_life_node),
            ("NGO Matching", match_ngos_node),
            ("Route Optimization", optimize_route_node),
            ("Volunteer Assignment", assign_volunteer_node),
            ("Recommendation", generate_recommendation_node),
        ]

    async def run(self, donation: dict, ngos: list, volunteers: list) -> dict:
        """Execute the full multi-agent pipeline."""
        state: AgentState = {
            "donation": donation,
            "ngos": ngos,
            "volunteers": volunteers,
            "food_analysis": None,
            "shelf_life": None,
            "matches": None,
            "route": None,
            "volunteer_assignment": None,
            "recommendation": None,
            "notifications_sent": [],
            "error": None,
        }

        execution_log = []

        for step_name, node_fn in self.steps:
            try:
                state = await node_fn(state)
                execution_log.append({"step": step_name, "status": "success"})
            except Exception as e:
                execution_log.append({"step": step_name, "status": "failed", "error": str(e)})
                state["error"] = f"{step_name} failed: {str(e)}"

        return {
            "state": state,
            "execution_log": execution_log,
            "pipeline_complete": state.get("error") is None
        }


# Singleton instance
foodbridge_workflow = FoodBridgeWorkflow()
