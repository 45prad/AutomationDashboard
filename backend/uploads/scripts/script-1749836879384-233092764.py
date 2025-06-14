#!/usr/bin/env python3
import sys

if len(sys.argv) != 2:
    print("Usage: python3 dummy_failure.py <ip>")
    sys.exit(1)

ip = sys.argv[1]
print(f"Running dummy failure script against {ip}")
print("This would simulate a blocked/failed attack")
sys.exit(1)  # Explicit failure