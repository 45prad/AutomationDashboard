#!/usr/bin/env python3
import sys
import time
import random

def main():
    # Get all IP arguments (skip first argument which is the script name)
    ips = sys.argv[1:]
    
    if not ips:
        print("Error: No IP addresses provided")
        print("Usage: python script.py ip1 ip2 ip3 ...")
        sys.exit(1)
    
    print(f"Starting execution for {len(ips)} IP addresses: {', '.join(ips)}")
    print("=" * 50)
    
    # Process each IP
    for i, ip in enumerate(ips, 1):
        try:
            print(f"\nProcessing IP {i}/{len(ips)}: {ip}")
            
            # Simulate some work
            time.sleep(random.uniform(0.5, 2.0))
            
            # Randomly succeed or fail (80% success rate)
            if random.random() < 0.8:
                print(f"Successfully processed {ip}")
                print(f"Result for {ip}: Operation completed successfully")
            else:
                print(f"Failed to process {ip}")
                print(f"Error for {ip}: Connection timeout")
                continue
                
            # Simulate additional processing
            time.sleep(random.uniform(0.1, 0.5))
            
        except Exception as e:
            print(f"Error processing {ip}: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Execution completed")
    print(f"Summary: Processed {len(ips)} IP addresses")

if __name__ == "__main__":
    main()