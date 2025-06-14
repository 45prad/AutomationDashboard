#!/usr/bin/env python3
import sys

if len(sys.argv) != 2:
    print("Usage: python3 dummy_error.py <ip>")
    sys.exit(1)

ip = sys.argv[1]
print(f"Running dummy error script against {ip}")
print("This would simulate a crashed attack")
# No explicit exit - will return 1 due to exception
raise Exception("Simulated crash")