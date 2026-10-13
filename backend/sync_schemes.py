#!/usr/bin/env python3
"""
CLI Tool: Yojana Hunter Scheme Synchronizer
Fetches, verifies official sources, upserts the 10 real government schemes into PostgreSQL,
and evaluates matching for the demonstration citizen profile.
"""

import sys
import os
import json

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.scheme_sync_service import SchemeSyncService

def main():
    print("=" * 75)
    print("YOJANA HUNTER — OFFICIAL SCHEME SYNCHRONIZATION ENGINE")
    print("=" * 75)
    print("1. Discovering target government schemes from official portals...")
    print("2. Verifying HTTP reachability, identity, and SSL certificate...")
    print("3. Performing idempotent upsert into PostgreSQL database...")
    print("4. Calculating 6-field deterministic eligibility matching...")
    print("-" * 75)

    summary = SchemeSyncService.sync_all_schemes()

    if not summary.get("success"):
        print(f"FAILED: {summary.get('error')}")
        sys.exit(1)

    print("\nSYNCHRONIZATION SUMMARY:")
    print(f"  * Schemes Attempted           : {summary['schemes_attempted']}")
    print(f"  * Schemes Successfully Fetched: {summary['schemes_fetched']}")
    print(f"  * Schemes Verified Live       : {summary['schemes_verified']}")
    print(f"  * Schemes Inserted (New)      : {summary['schemes_inserted']}")
    print(f"  * Schemes Updated             : {summary['schemes_updated']}")
    print(f"  * Schemes Skipped or Failed   : {summary['schemes_skipped_or_failed']}")
    print(f"  * Last Sync Timestamp         : {summary['last_sync_display']}")

    print("\nDEMO PROFILE MATCHES (Farmer, 24 yrs, UP, 10th Pass, OBC, Rs 1-3 Lakh):")
    matches = summary.get("demo_profile_matches", {})
    print(f"  * Eligible Matches            : {matches.get('eligible_count', 0)}")
    print(f"  * Possibly Eligible           : {matches.get('possibly_eligible_count', 0)}")
    print(f"  * Not Eligible                : {matches.get('not_eligible_count', 0)}")
    print(f"  * Total Evaluated             : {matches.get('total_evaluated', 0)}")

    print("\nOFFICIAL SOURCE STATUS AUDIT:")
    for src in summary.get("source_statuses", []):
        print(f"  [{src['status']}] {src['name']}")
        print(f"      Official Portal: {src['url']} ({src['latency_ms']} ms)")
        print(f"      Application URL: {src['application_url']}")

    print("=" * 75)
    print("All 10 official government schemes synchronized into PostgreSQL successfully.")
    print("=" * 75)

if __name__ == "__main__":
    main()
