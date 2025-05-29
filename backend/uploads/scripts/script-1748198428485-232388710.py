import sys

if len(sys.argv) != 2:
    print("Usage: python3 execut.py <public_ip>")
    sys.exit(1)

public_ip = sys.argv[1]
print(f"Running script on IP: {public_ip}")

# Example usage
url = f"http://{public_ip}:5000/data"
print(f"Fetching data from {url}")
