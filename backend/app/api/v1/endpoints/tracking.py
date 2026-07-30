from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi import status
from fastapi.exceptions import HTTPException
from app.core.security import decode_access_token
from typing import Dict, Set
import json

router = APIRouter()

# In-memory connection maps (simple pub/sub)
match_connections: Dict[int, Set[WebSocket]] = {}
volunteer_connections: Dict[int, WebSocket] = {}
last_location_by_match: Dict[int, dict] = {}


@router.websocket('/ws/tracking/{match_id}')
async def ws_tracking(websocket: WebSocket, match_id: int):
    # Require a JWT token query param for auth
    token = websocket.query_params.get('token')
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    try:
        payload = decode_access_token(token)
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    conns = match_connections.setdefault(match_id, set())
    conns.add(websocket)

    # If we have a last-known location, send it immediately
    if match_id in last_location_by_match:
        try:
            await websocket.send_json({"type": "location", "payload": last_location_by_match[match_id]})
        except Exception:
            pass

    try:
        while True:
            # keep connection open; donors don't need to send messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        conns.discard(websocket)
    finally:
        if not conns:
            match_connections.pop(match_id, None)


@router.websocket('/ws/volunteer/{volunteer_id}')
async def ws_volunteer(websocket: WebSocket, volunteer_id: int):
    # Require JWT auth and ensure the token subject matches the volunteer id
    token = websocket.query_params.get('token')
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    try:
        payload = decode_access_token(token)
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    sub = payload.get('sub')
    try:
        if int(sub) != int(volunteer_id):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    volunteer_connections[volunteer_id] = websocket
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
            except Exception:
                continue

            # Expected: {"match_id": 123, "latitude": x, "longitude": y, ...}
            match_id = payload.get('match_id')
            if not match_id:
                continue

            # Save last known location for the match
            last_location_by_match[match_id] = payload

            # Broadcast to all donor listeners for this match
            receivers = list(match_connections.get(match_id, set()))
            for ws in receivers:
                try:
                    await ws.send_json({"type": "location", "payload": payload})
                except Exception:
                    # ignore send errors; cleanup happens on disconnect
                    pass

    except WebSocketDisconnect:
        volunteer_connections.pop(volunteer_id, None)
    finally:
        volunteer_connections.pop(volunteer_id, None)
