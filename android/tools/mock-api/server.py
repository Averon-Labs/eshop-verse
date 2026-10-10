#!/usr/bin/env python3
"""
EShop Verse — Local Contract Mock API Server
Implements docs/android/API-MOCK-STRATEGY.md for offline and emulator development.

Binds to 127.0.0.1:8081 by default.
Replays contract-conformant fixtures from android/app/src/test/resources/fixtures/api.
Maintains in-memory mutable state for cart and orders.
Honours Idempotency-Key for POST /orders and POST /orders/{id}/payment.
"""

import argparse
import json
import os
import sys
import uuid
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_FIXTURES_DIR = SCRIPT_DIR.parent.parent / "app" / "src" / "test" / "resources" / "fixtures" / "api"


class MockApiState:
    def __init__(self, fixtures_dir: Path):
        self.fixtures_dir = fixtures_dir
        self.idempotency_store = {}
        self.orders = []
        self.cart_items = []
        self.reset()

    def reset(self):
        self.idempotency_store.clear()
        self.orders.clear()
        self.cart_items = [
            {
                "id": 1,
                "productId": 101,
                "productName": "Classic Leather Sneaker",
                "unitPrice": "89.99",
                "quantity": 1,
                "lineTotal": "89.99"
            }
        ]

    def load_fixture(self, operation_id: str, scenario: str = "success") -> dict:
        fixture_path = self.fixtures_dir / operation_id / f"{scenario}.json"
        if not fixture_path.exists():
            return {"error": {"code": "NOT_FOUND", "message": f"Fixture not found: {operation_id}/{scenario}"}}
        with open(fixture_path, "r", encoding="utf-8") as f:
            return json.load(f)


class MockApiHandler(BaseHTTPRequestHandler):
    state: MockApiState = None

    def _send_json(self, status_code: int, data: dict):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_body_json(self) -> dict:
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > 0:
            body_bytes = self.rfile.read(content_length)
            try:
                return json.loads(body_bytes.decode("utf-8"))
            except Exception:
                return {}
        return {}

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Control endpoints
        if path == "/__mock/state":
            self._send_json(200, {
                "cartItems": self.state.cart_items,
                "orderCount": len(self.state.orders),
                "cachedIdempotencyKeys": list(self.state.idempotency_store.keys())
            })
            return

        # API Routes
        if path == "/api/v1/categories":
            data = self.state.load_fixture("listCategories", "success")
            self._send_json(200, data)
            return

        if path == "/api/v1/products":
            data = self.state.load_fixture("listProducts", "success")
            self._send_json(200, data)
            return

        if path.startswith("/api/v1/products/"):
            prod_id = path.replace("/api/v1/products/", "")
            if prod_id in ("101", "102"):
                data = self.state.load_fixture("getProduct", "success")
                self._send_json(200, data)
            else:
                data = self.state.load_fixture("getProduct", "not-found")
                self._send_json(404, data)
            return

        if path == "/api/v1/auth/profile":
            auth_header = self.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                self._send_json(401, self.state.load_fixture("common", "unauthenticated"))
                return
            user_data = self.state.load_fixture("loginCustomer", "success")["data"]["user"]
            self._send_json(200, {"data": user_data})
            return

        if path == "/api/v1/cart":
            subtotal = sum(float(item["lineTotal"]) for item in self.state.cart_items)
            cart_resp = {
                "data": {
                    "items": self.state.cart_items,
                    "itemCount": len(self.state.cart_items),
                    "subtotal": f"{subtotal:.2f}"
                }
            }
            self._send_json(200, cart_resp)
            return

        if path == "/api/v1/orders":
            summaries = [
                {
                    "id": o.get("id", 5001),
                    "orderNumber": o.get("orderNumber", "ORD-2026-0001"),
                    "status": o.get("status", "pending_payment"),
                    "total": o.get("total", "94.99"),
                    "itemCount": len(o.get("items", [])),
                    "createdAt": o.get("createdAt", "2026-10-10T12:00:00Z")
                }
                for o in self.state.orders
            ]
            self._send_json(200, {
                "data": summaries,
                "pagination": {
                    "currentPage": 1,
                    "perPage": 20,
                    "totalItems": len(summaries),
                    "totalPages": 1
                }
            })
            return

        if path.startswith("/api/v1/orders/"):
            order_id = path.replace("/api/v1/orders/", "")
            for o in self.state.orders:
                if str(o.get("id")) == order_id:
                    self._send_json(200, {"data": o})
                    return
            self._send_json(200, self.state.load_fixture("createOrder", "success"))
            return

        self._send_json(404, {"error": {"code": "NOT_FOUND", "message": "Unknown endpoint", "details": []}})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._read_body_json()

        # Control endpoints
        if path == "/__mock/reset":
            self.state.reset()
            self._send_json(200, {"status": "reset", "message": "In-memory state restored to seed"})
            return

        if path == "/api/v1/auth/register" or path == "/api/v1/auth/login":
            email = body.get("email", "")
            password = body.get("password", "")
            if not email or not password:
                self._send_json(422, self.state.load_fixture("common", "validation-error"))
                return
            if password == "wrongpassword":
                self._send_json(401, self.state.load_fixture("loginCustomer", "invalid-credentials"))
                return
            self._send_json(200, self.state.load_fixture("loginCustomer", "success"))
            return

        if path == "/api/v1/auth/logout":
            self.send_response(204)
            self.end_headers()
            return

        if path == "/api/v1/auth/password-reset":
            self.send_response(202)
            self.end_headers()
            return

        if path == "/api/v1/auth/password-reset/confirm":
            self.send_response(204)
            self.end_headers()
            return

        if path == "/api/v1/cart/items":
            prod_id = body.get("productId", 101)
            qty = body.get("quantity", 1)
            self.state.cart_items.append({
                "id": len(self.state.cart_items) + 1,
                "productId": prod_id,
                "productName": "Classic Leather Sneaker",
                "unitPrice": "89.99",
                "quantity": qty,
                "lineTotal": f"{89.99 * qty:.2f}"
            })
            subtotal = sum(float(item["lineTotal"]) for item in self.state.cart_items)
            self._send_json(200, {
                "data": {
                    "items": self.state.cart_items,
                    "itemCount": len(self.state.cart_items),
                    "subtotal": f"{subtotal:.2f}"
                }
            })
            return

        if path == "/api/v1/checkout/quote":
            self._send_json(200, {
                "data": {
                    "subtotal": "89.99",
                    "shipping": "5.00",
                    "total": "94.99",
                    "itemLines": self.state.cart_items
                }
            })
            return

        if path == "/api/v1/orders":
            idempotency_key = self.headers.get("Idempotency-Key")
            if not idempotency_key:
                self._send_json(400, self.state.load_fixture("createOrder", "missing-idempotency-key"))
                return
            if idempotency_key in self.state.idempotency_store:
                cached = self.state.idempotency_store[idempotency_key]
                self._send_json(201, cached)
                return

            order_data = self.state.load_fixture("createOrder", "success")
            order_data["data"]["id"] = 5000 + len(self.state.orders) + 1
            order_data["data"]["orderNumber"] = f"ORD-2026-{len(self.state.orders) + 1:04d}"
            self.state.orders.append(order_data["data"])
            self.state.idempotency_store[idempotency_key] = order_data
            self.state.cart_items.clear()
            self._send_json(201, order_data)
            return

        if "/payment" in path:
            idempotency_key = self.headers.get("Idempotency-Key")
            if not idempotency_key:
                self._send_json(400, self.state.load_fixture("createOrder", "missing-idempotency-key"))
                return
            if idempotency_key in self.state.idempotency_store:
                self._send_json(200, self.state.idempotency_store[idempotency_key])
                return

            outcome = body.get("simulateOutcome", "success")
            if outcome == "failure":
                err = self.state.load_fixture("submitSimulatedPayment", "payment-failure")
                self._send_json(409, err)
                return

            result = self.state.load_fixture("submitSimulatedPayment", "success")
            self.state.idempotency_store[idempotency_key] = result
            self._send_json(200, result)
            return

        self._send_json(404, {"error": {"code": "NOT_FOUND", "message": "Unknown endpoint", "details": []}})

    def do_PATCH(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._read_body_json()

        if path == "/api/v1/auth/profile":
            user_data = self.state.load_fixture("loginCustomer", "success")["data"]["user"]
            user_data["firstName"] = body.get("firstName", user_data["firstName"])
            user_data["lastName"] = body.get("lastName", user_data["lastName"])
            self._send_json(200, {"data": user_data})
            return

        if path.startswith("/api/v1/cart/items/"):
            qty = body.get("quantity", 1)
            for item in self.state.cart_items:
                item["quantity"] = qty
                item["lineTotal"] = f"{float(item['unitPrice']) * qty:.2f}"
            subtotal = sum(float(item["lineTotal"]) for item in self.state.cart_items)
            self._send_json(200, {
                "data": {
                    "items": self.state.cart_items,
                    "itemCount": len(self.state.cart_items),
                    "subtotal": f"{subtotal:.2f}"
                }
            })
            return

        self._send_json(404, {"error": {"code": "NOT_FOUND", "message": "Unknown endpoint", "details": []}})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/v1/cart/items/"):
            prod_id_str = path.replace("/api/v1/cart/items/", "")
            self.state.cart_items = [i for i in self.state.cart_items if str(i["productId"]) != prod_id_str]
            subtotal = sum(float(item["lineTotal"]) for item in self.state.cart_items)
            self._send_json(200, {
                "data": {
                    "items": self.state.cart_items,
                    "itemCount": len(self.state.cart_items),
                    "subtotal": f"{subtotal:.2f}"
                }
            })
            return

        if path == "/api/v1/cart":
            self.state.cart_items.clear()
            self.send_response(204)
            self.end_headers()
            return

        self._send_json(404, {"error": {"code": "NOT_FOUND", "message": "Unknown endpoint", "details": []}})


def run(host: str = "127.0.0.1", port: int = 8081, fixtures_dir: Path = DEFAULT_FIXTURES_DIR):
    if not fixtures_dir.exists():
        print(f"Error: fixtures directory does not exist: {fixtures_dir}", file=sys.stderr)
        sys.exit(1)

    state = MockApiState(fixtures_dir)
    MockApiHandler.state = state

    server_address = (host, port)
    httpd = HTTPServer(server_address, MockApiHandler)
    print(f"EShop Verse Mock API running at http://{host}:{port}/api/v1 (fixtures: {fixtures_dir})")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down mock server.")
        httpd.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="EShop Verse Mock API Server")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8081, help="Bind port (default: 8081)")
    parser.add_argument("--fixtures-dir", type=Path, default=DEFAULT_FIXTURES_DIR, help="Path to fixtures/api directory")
    args = parser.parse_args()
    run(args.host, args.port, args.fixtures_dir)
