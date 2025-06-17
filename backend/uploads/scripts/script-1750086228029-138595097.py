#!/usr/bin/env python3
import sys

if len(sys.argv) != 2:
    print("Usage: python3 dummy_success.py <ip>")
    sys.exit(1)

ip = sys.argv[1]
print(f"Running dummy success script against {ip}")
print("This would simulate a successful attack")
sys.exit(0)  # Explicit success