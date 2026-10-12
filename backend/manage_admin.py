#!/usr/bin/env python3
"""
Admin Management CLI for Yojana Hunter.
Usage:
  python manage_admin.py create --email admin@yojanahunter.gov.in --password "Admin@12345"
  python manage_admin.py create --interactive
  python manage_admin.py list
"""

import sys
import argparse
import getpass
from database import SessionLocal, init_db
from models import User
from utils.auth import hash_password

def create_or_update_admin(email: str, password: str, mobile: str = None):
    db = SessionLocal()
    try:
        # Check if user with this email exists
        user = db.query(User).filter(User.email == email).first()
        hashed = hash_password(password)

        if user:
            user.password_hash = hashed
            user.role = "admin"
            user.is_active = True
            if mobile:
                user.mobile = mobile
            db.commit()
            print(f"[SUCCESS] Updated existing user '{email}' to active Admin role.")
        else:
            new_admin = User(
                email=email,
                mobile=mobile,
                password_hash=hashed,
                role="admin",
                is_active=True
            )
            db.add(new_admin)
            db.commit()
            print(f"[SUCCESS] Created new Admin user with email '{email}'.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to create/update admin: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

def list_admins():
    db = SessionLocal()
    try:
        admins = db.query(User).filter(User.role == "admin").all()
        if not admins:
            print("No admin users found in database.")
            return

        print(f"Total Admins: {len(admins)}")
        print("-" * 60)
        print(f"{'ID':<6} {'Email':<30} {'Active':<8} {'Created At'}")
        print("-" * 60)
        for a in admins:
            created = a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "N/A"
            print(f"{a.id:<6} {a.email or 'N/A':<30} {str(a.is_active):<8} {created}")
    except Exception as e:
        print(f"[ERROR] Failed to list admins: {e}", file=sys.stderr)
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Yojana Hunter Admin Account Management")
    subparsers = parser.add_subparsers(dest="command", help="Sub-commands")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create or reset an admin account")
    create_parser.add_argument("--email", type=str, help="Admin email address")
    create_parser.add_argument("--password", type=str, help="Admin password")
    create_parser.add_argument("--mobile", type=str, default=None, help="Optional admin mobile number")
    create_parser.add_argument("--interactive", action="store_true", help="Prompt for credentials interactively")

    # List command
    subparsers.add_parser("list", help="List all admin accounts")

    args = parser.parse_args()

    if args.command == "create":
        email = args.email
        password = args.password

        if args.interactive or not (email and password):
            if not email:
                email = input("Enter admin email (e.g. admin@yojanahunter.gov.in): ").strip()
            if not password:
                password = getpass.getpass("Enter admin password: ").strip()
                confirm = getpass.getpass("Confirm admin password: ").strip()
                if password != confirm:
                    print("[ERROR] Passwords do not match.", file=sys.stderr)
                    sys.exit(1)

        if not email or not password:
            print("[ERROR] Email and password are required.", file=sys.stderr)
            sys.exit(1)

        create_or_update_admin(email, password, args.mobile)
    elif args.command == "list":
        list_admins()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
