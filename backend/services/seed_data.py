import logging
from database import SessionLocal
from models import (
    User, Profile, Scheme, SchemeRule, SchemeDocumentRequirement,
    UserDocument, Application
)

logger = logging.getLogger(__name__)

SCHEMES_DATA = [
    {
        "slug": "pm-vidyalakshmi",
        "name": "PM Vidyalakshmi Scheme",
        "short_description": "Education loan for higher studies",
        "description": "A single window electronic platform for students seeking education loans and scholarships. Covers course fees, living expenses, and tuition assistance for higher technical education.",
        "category": "Education",
        "department": "Ministry of Education",
        "level": "Central Scheme",
        "benefits": "Up to ₹6.5 Lakh",
        "official_source_url": "https://www.vidyalakshmi.co.in",
        "last_verified_date": "01 Oct 2026",
        "priority": "High Priority",
        "state": "All India",
        "rules": [
            {
                "rule_name": "Age Limit",
                "rule_description": "18 – 30 years",
                "rule_logic": {"field": "age", "op": "<=", "value": 30},
                "is_mandatory": True
            },
            {
                "rule_name": "Annual Family Income",
                "rule_description": "≤ 8 Lakh",
                "rule_logic": {"field": "annual_income", "op": "<=", "value": "8 Lakh"},
                "is_mandatory": True
            },
            {
                "rule_name": "Education",
                "rule_description": "12th Pass / Degree enrolled",
                "rule_logic": {"field": "education", "op": "in", "value": ["12th Pass", "Graduate", "B.E.", "Diploma", "B.Tech", "Degree"]},
                "is_mandatory": True
            },
            {
                "rule_name": "State / Nationality",
                "rule_description": "Indian Citizen (All States)",
                "rule_logic": {"field": "state", "op": "eq", "value": "All India"},
                "is_mandatory": True
            }
        ],
        "documents": ["Aadhaar Card", "Income Certificate", "Education Certificate", "Bank Passbook", "Photo"]
    },
    {
        "slug": "post-matric-scholarship",
        "name": "Post Matric Scholarship (State Govt.)",
        "short_description": "Financial support for students",
        "description": "Financial assistance provided by the Maharashtra Government to students studying in post-matriculation courses, covering tuition fee reimbursement and exam fees.",
        "category": "Education",
        "department": "Dept. of Higher & Technical Education",
        "level": "State Scheme",
        "benefits": "₹5,000 – ₹20,000",
        "official_source_url": "https://mahadbt.maharashtra.gov.in",
        "last_verified_date": "15 Sep 2026",
        "priority": "High Priority",
        "state": "Maharashtra",
        "rules": [
            {
                "rule_name": "Age Limit",
                "rule_description": "17 – 25 years",
                "rule_logic": {"field": "age", "op": "<=", "value": 25},
                "is_mandatory": True
            },
            {
                "rule_name": "Annual Family Income",
                "rule_description": "≤ 2.5 Lakh",
                "rule_logic": {"field": "annual_income", "op": "<=", "value": "2.5 Lakh"},
                "is_mandatory": True
            },
            {
                "rule_name": "Education",
                "rule_description": "Post-Matric / Degree",
                "rule_logic": {"field": "education", "op": "in", "value": ["Post-Matric", "Degree", "B.E.", "B.Tech", "Graduate"]},
                "is_mandatory": True
            },
            {
                "rule_name": "Domicile",
                "rule_description": "Maharashtra Resident",
                "rule_logic": {"field": "state", "op": "eq", "value": "Maharashtra"},
                "is_mandatory": True
            }
        ],
        "documents": ["Aadhaar Card", "Income Certificate", "Education Certificate", "Bank Passbook", "Photo"]
    },
    {
        "slug": "skill-india-training",
        "name": "Skill India — Training Program",
        "short_description": "Skill development & certification",
        "description": "Flagship scheme under PMKVY for skill development training, soft-skills enhancement, and NSQF accredited industry certification with placement support.",
        "category": "Skill Development",
        "department": "Ministry of Skill Development & Entrepreneurship",
        "level": "Central Scheme",
        "benefits": "Free Training + Certificate",
        "official_source_url": "https://www.skillindia.gov.in",
        "last_verified_date": "28 Sep 2026",
        "priority": "Medium Priority",
        "state": "All India",
        "rules": [
            {
                "rule_name": "Age Limit",
                "rule_description": "18 – 35 years",
                "rule_logic": {"field": "age", "op": "<=", "value": 35},
                "is_mandatory": True
            },
            {
                "rule_name": "Education",
                "rule_description": "10th / 12th Pass",
                "rule_logic": {"field": "education", "op": "in", "value": ["10th Pass", "12th Pass", "Graduate", "B.E."]},
                "is_mandatory": True
            },
            {
                "rule_name": "Training Center Enrollment",
                "rule_description": "Enrolled in Approved Center",
                "rule_logic": {"field": "training_enrolled", "op": "eq", "value": "true"},
                "is_mandatory": False
            }
        ],
        "documents": ["Aadhaar Card", "Education Certificate", "Photo"]
    },
    {
        "slug": "mjp-jan-arogya",
        "name": "Mahatma Jyotiba Phule Jan Arogya Yojana",
        "short_description": "Cashless health insurance coverage",
        "description": "Maharashtra state health insurance scheme offering up to ₹5 Lakh cashless coverage for identified medical procedures for low-income families.",
        "category": "Health",
        "department": "Govt. of Maharashtra",
        "level": "State Scheme",
        "benefits": "Up to ₹5 Lakh cashless treatment",
        "official_source_url": "https://www.jeevandayee.gov.in",
        "last_verified_date": "05 Oct 2026",
        "priority": "Medium Priority",
        "state": "Maharashtra",
        "rules": [
            {
                "rule_name": "Ration Card Category",
                "rule_description": "Yellow / Orange Ration Card or BPL",
                "rule_logic": {"field": "category", "op": "in", "value": ["BPL", "Antyodaya", "OBC", "SC", "ST"]},
                "is_mandatory": True
            },
            {
                "rule_name": "Domicile",
                "rule_description": "Maharashtra Resident",
                "rule_logic": {"field": "state", "op": "eq", "value": "Maharashtra"},
                "is_mandatory": True
            }
        ],
        "documents": ["Aadhaar Card", "Ration Card", "Income Certificate"]
    },
    {
        "slug": "naps-apprenticeship",
        "name": "National Apprenticeship Promotion Scheme (NAPS)",
        "short_description": "Industrial training stipend & job placement",
        "description": "Government-backed stipend sharing for graduate engineers and diploma holders in leading industrial establishments.",
        "category": "Employment",
        "department": "Ministry of Skill Development",
        "level": "Central Scheme",
        "benefits": "₹9,000 / month stipend",
        "official_source_url": "https://www.apprenticeshipindia.gov.in",
        "last_verified_date": "12 Oct 2026",
        "priority": "High Priority",
        "state": "All India",
        "rules": [
            {
                "rule_name": "Age Limit",
                "rule_description": "18 – 28 years",
                "rule_logic": {"field": "age", "op": "<=", "value": 28},
                "is_mandatory": True
            },
            {
                "rule_name": "Degree Qualification",
                "rule_description": "Diploma / Degree pursuing or completed",
                "rule_logic": {"field": "education", "op": "in", "value": ["Diploma", "Degree", "B.E.", "B.Tech", "Graduate"]},
                "is_mandatory": True
            }
        ],
        "documents": ["Aadhaar Card", "Education Certificate", "Bank Passbook"]
    },
    {
        "slug": "pm-internship-scheme",
        "name": "PM Internship Scheme in Top 500 Companies",
        "short_description": "12-month corporate internship with monthly allowance",
        "description": "Provides youth with valuable real-world business exposure in top Indian enterprises with financial support.",
        "category": "Employment",
        "department": "Ministry of Corporate Affairs",
        "level": "Central Scheme",
        "benefits": "₹5,000/mo + ₹6,000 one-time grant",
        "official_source_url": "https://pminternship.mca.gov.in",
        "last_verified_date": "10 Oct 2026",
        "priority": "High Priority",
        "state": "All India",
        "rules": [
            {
                "rule_name": "Age Limit",
                "rule_description": "21 – 24 years",
                "rule_logic": {"field": "age", "op": "<=", "value": 24},
                "is_mandatory": True
            },
            {
                "rule_name": "Family Income",
                "rule_description": "≤ 8 Lakh",
                "rule_logic": {"field": "annual_income", "op": "<=", "value": "8 Lakh"},
                "is_mandatory": True
            }
        ],
        "documents": ["Aadhaar Card", "Education Certificate", "Bank Passbook", "Photo"]
    },
    {
        "slug": "pm-vishwakarma",
        "name": "PM Vishwakarma Scheme",
        "short_description": "End-to-end support for traditional artisans & craftspeople",
        "description": "Collateral-free loans at concessional 5% interest rate, skill verification, modern toolkits incentive, and digital marketing support for 18 traditional trades.",
        "category": "Skill Development",
        "department": "Ministry of Micro, Small and Medium Enterprises",
        "level": "Central Scheme",
        "benefits": "Up to ₹3 Lakh collateral-free loan + ₹15,000 toolkit",
        "official_source_url": "https://pmvishwakarma.gov.in",
        "last_verified_date": "08 Oct 2026",
        "priority": "High Priority",
        "state": "All India",
        "rules": [
            {
                "rule_name": "Age Limit",
                "rule_description": "18 years and above",
                "rule_logic": {"field": "age", "op": ">=", "value": 18},
                "is_mandatory": True
            },
            {
                "rule_name": "Traditional Artisan / Trade",
                "rule_description": "Engaged in one of 18 traditional crafts",
                "rule_logic": {"field": "occupation", "op": "in", "value": ["Artisan", "Carpenter", "Blacksmith", "Mason", "Self-Employed"]},
                "is_mandatory": True
            }
        ],
        "documents": ["Aadhaar Card", "Trade Certificate", "Bank Passbook"]
    },
    {
        "slug": "stand-up-india",
        "name": "Stand-Up India Scheme",
        "short_description": "Bank loans for SC/ST and Women entrepreneurs",
        "description": "Facilitates bank loans between ₹10 Lakh and ₹1 Crore to at least one SC or ST borrower and at least one woman borrower per bank branch for setting up a greenfield enterprise.",
        "category": "Entrepreneurship",
        "department": "Ministry of Finance",
        "level": "Central Scheme",
        "benefits": "Bank loans ₹10 Lakh – ₹1 Crore",
        "official_source_url": "https://www.standupmitra.in",
        "last_verified_date": "10 Oct 2026",
        "priority": "Medium Priority",
        "state": "All India",
        "rules": [
            {
                "rule_name": "Category / Gender",
                "rule_description": "SC, ST, or Woman Entrepreneur",
                "rule_logic": {"field": "category", "op": "in", "value": ["SC", "ST", "Woman"]},
                "is_mandatory": True
            },
            {
                "rule_name": "Age Limit",
                "rule_description": "Above 18 years",
                "rule_logic": {"field": "age", "op": ">=", "value": 18},
                "is_mandatory": True
            }
        ],
        "documents": ["Aadhaar Card", "Caste Certificate", "Project Report", "Bank Passbook"]
    }
]

DOCUMENTS_DATA = [
    {"doc_key": "doc-1", "name": "Aadhaar Card", "document_type": "Identity", "file_name": "aadhaar_card_masked.pdf", "file_size": "1.2 MB", "status": "uploaded", "required_for": ["PM Vidyalakshmi", "Post Matric Scholarship", "PM Vishwakarma"]},
    {"doc_key": "doc-2", "name": "Income Certificate", "document_type": "Income Proof", "file_name": "income_cert_2026.pdf", "file_size": "2.4 MB", "status": "uploaded", "required_for": ["PM Vidyalakshmi", "Post Matric Scholarship"]},
    {"doc_key": "doc-3", "name": "Degree / Education Marksheet", "document_type": "Academic", "file_name": "sem7_marksheet.pdf", "file_size": "3.1 MB", "status": "uploaded", "required_for": ["PM Vidyalakshmi", "PM Internship Scheme"]},
    {"doc_key": "doc-4", "name": "Domicile Certificate", "document_type": "Residence Proof", "file_name": "domicile_mh.pdf", "file_size": "1.8 MB", "status": "uploaded", "required_for": ["Post Matric Scholarship", "MJP Jan Arogya"]},
    {"doc_key": "doc-5", "name": "Bank Passbook", "document_type": "Financial", "file_name": "sbi_passbook.pdf", "file_size": "950 KB", "status": "uploaded", "required_for": ["PM Vidyalakshmi", "NAPS Scheme"]},
    {"doc_key": "doc-6", "name": "Passport Size Photograph", "document_type": "Photo", "file_name": "photo_white_bg.jpg", "file_size": "420 KB", "status": "uploaded", "required_for": ["All Schemes"]},
    {"doc_key": "doc-7", "name": "Caste Certificate", "document_type": "Category Proof", "file_name": None, "file_size": None, "status": "missing", "required_for": ["Stand-Up India", "Post Matric Scholarship"]},
    {"doc_key": "doc-8", "name": "Ration Card", "document_type": "Family Proof", "file_name": None, "file_size": None, "status": "missing", "required_for": ["MJP Jan Arogya"]}
]

def seed_database():
    """Seed initial user, schemes, documents, and application drafts."""
    db = SessionLocal()
    try:
        # 1. Seed or update demo user
        user = db.query(User).filter(User.email == "aditi.lagad@example.com").first()
        if not user:
            user = User(
                email="aditi.lagad@example.com",
                mobile="9876543210",
                password_hash="sha256$seededpasswordhash123",
                role="citizen",
                is_active=True
            )
            db.add(user)
            db.flush()

        # 2. Seed or update profile
        profile = db.query(Profile).filter(Profile.user_id == user.id).first()
        if not profile:
            profile = Profile(
                user_id=user.id,
                full_name="Aditi Lagad",
                age=21,
                gender="Female",
                occupation="Student",
                annual_income="< 1 Lakh",
                income_numeric=95000,
                education="B.E. (Final Year)",
                state="Maharashtra",
                district="Nashik",
                category="General",
                father_name="Santosh Lagad",
                date_of_birth="12-05-2005",
                preferred_language="en",
                completeness_percent=90
            )
            db.add(profile)
            db.flush()

        # 3. Seed Schemes
        for s_data in SCHEMES_DATA:
            scheme = db.query(Scheme).filter(Scheme.slug == s_data["slug"]).first()
            if not scheme:
                scheme = Scheme(
                    slug=s_data["slug"],
                    name=s_data["name"],
                    short_description=s_data["short_description"],
                    description=s_data["description"],
                    benefits=s_data["benefits"],
                    category=s_data["category"],
                    department=s_data["department"],
                    level=s_data["level"],
                    official_source_url=s_data["official_source_url"],
                    last_verified_date=s_data["last_verified_date"],
                    priority=s_data["priority"],
                    state=s_data["state"]
                )
                db.add(scheme)
                db.flush()

                # Add Rules
                for r in s_data["rules"]:
                    rule = SchemeRule(
                        scheme_id=scheme.id,
                        rule_name=r["rule_name"],
                        rule_description=r["rule_description"],
                        rule_logic=r["rule_logic"],
                        is_mandatory=r["is_mandatory"]
                    )
                    db.add(rule)

                # Add Required Documents
                for d in s_data["documents"]:
                    doc_req = SchemeDocumentRequirement(
                        scheme_id=scheme.id,
                        document_name=d,
                        is_mandatory=True
                    )
                    db.add(doc_req)

        # 4. Seed User Documents
        for d_data in DOCUMENTS_DATA:
            existing_doc = db.query(UserDocument).filter(
                (UserDocument.user_id == user.id) & (UserDocument.doc_key == d_data["doc_key"])
            ).first()
            if not existing_doc:
                user_doc = UserDocument(
                    user_id=user.id,
                    doc_key=d_data["doc_key"],
                    name=d_data["name"],
                    document_type=d_data["document_type"],
                    file_name=d_data["file_name"],
                    file_size=d_data["file_size"],
                    status=d_data["status"],
                    required_for=d_data["required_for"],
                    is_verified=(d_data["status"] == "uploaded")
                )
                db.add(user_doc)

        # 5. Seed Demo Application
        app = db.query(Application).filter(Application.application_number == "DRAFT-2026-VL-8941").first()
        if not app:
            vl_scheme = db.query(Scheme).filter(Scheme.slug == "pm-vidyalakshmi").first()
            scheme_id = vl_scheme.id if vl_scheme else 1
            app = Application(
                application_number="DRAFT-2026-VL-8941",
                user_id=user.id,
                scheme_id=scheme_id,
                scheme_name="PM Vidyalakshmi Scheme",
                status="draft",
                applicant_name="Aditi Lagad",
                father_name="Santosh Lagad",
                date_of_birth="12-05-2005",
                education="B.E. (Final Year)",
                family_income="< 1 Lakh",
                state="Maharashtra",
                district="Nashik",
                description="Pre-filled official draft ready for download & submission."
            )
            db.add(app)

        db.commit()
        logger.info("Database seeding completed successfully.")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
