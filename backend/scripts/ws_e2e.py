"""Simple end-to-end WebSocket test using TestClient.

Run with: python scripts/ws_e2e.py
"""
import json
import time
import sys
import os

# Ensure backend package root is on sys.path so `import app` works
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from starlette.testclient import TestClient

from app.main import app
from app.core.security import create_access_token


def run_test():
    print('Starting WS e2e test')
    with TestClient(app) as client:
        # create tokens for volunteer id 42 and donor id 7
        vol_token = create_access_token({"sub": str(42), "role": "volunteer"})
        donor_token = create_access_token({"sub": str(7), "role": "donor"})

        # connect donor listener for match_id 1
        with client.websocket_connect(f'/api/v1/ws/tracking/1?token={donor_token}') as donor_ws:
            print('Donor websocket connected')

            # connect volunteer socket and send a location
            with client.websocket_connect(f'/api/v1/ws/volunteer/42?token={vol_token}') as vol_ws:
                print('Volunteer websocket connected')
                payload = {
                    'match_id': 1,
                    'latitude': 12.345678,
                    'longitude': 98.765432,
                    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                }
                vol_ws.send_text(json.dumps(payload))
                print('Volunteer sent payload')

                # donor should receive the broadcast
                msg = donor_ws.receive_json()
                print('Donor received message:', msg)

                assert msg.get('type') == 'location'
                assert msg.get('payload', {}).get('match_id') == 1

    print('WS e2e test completed successfully')


if __name__ == '__main__':
    run_test()
