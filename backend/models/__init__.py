import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from database import Base

# Gracefully handle pgvector if available, fallback to JSON for standard PostgreSQL
try:
    from pgvector.sqlalchemy import Vector  # type: ignore
    VectorColumnType = Vector(384)
except Exception:
    VectorColumnType = JSON

# ==========================================
# 1. USERS & TRUST DOMAIN
# ==========================================

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    mobile = Column(String(20), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="citizen")  # citizen, helper, curator, reviewer, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    consents = relationship("ConsentRecord", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    documents = relationship("UserDocument", back_populates="user")
    applications = relationship("Application", back_populates="user")
    interview_sessions = relationship("InterviewSession", back_populates="user")
    saved_schemes = relationship("SavedScheme", back_populates="user", cascade="all, delete-orphan")
    password_resets = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "mobile": self.mobile,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(50), nullable=True)
    occupation = Column(String(100), nullable=True)
    annual_income = Column(String(100), nullable=True)  # Formatted text e.g. "< 1 Lakh"
    income_numeric = Column(Float, nullable=True)      # Numeric value for rule evaluation
    education = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    category = Column(String(100), nullable=True)      # General, OBC, SC, ST, EWS
    father_name = Column(String(255), nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    land_holding_acres = Column(Float, default=0.0)
    is_disabled = Column(Boolean, default=False)
    is_farmer = Column(Boolean, default=False)
    is_student = Column(Boolean, default=False)
    course = Column(String(150), nullable=True)
    institution = Column(String(255), nullable=True)
    has_business = Column(Boolean, default=False)
    business_type = Column(String(150), nullable=True)
    disability_type = Column(String(150), nullable=True)
    is_tax_payer = Column(Boolean, default=False)
    is_govt_employee = Column(Boolean, default=False)
    preferred_language = Column(String(20), default="en")
    completeness_percent = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "name": self.full_name or "Citizen",
            "avatarUrl": self.avatar_url,
            "age": self.age or 0,
            "gender": self.gender,
            "occupation": self.occupation or "",
            "annualIncome": self.annual_income or "< 1 Lakh",
            "incomeNumeric": self.income_numeric,
            "education": self.education or "",
            "state": self.state or "",
            "district": self.district or "",
            "category": self.category or "General",
            "fatherName": self.father_name or "",
            "dateOfBirth": self.date_of_birth or "",
            "landHoldingAcres": self.land_holding_acres,
            "isDisabled": self.is_disabled,
            "isFarmer": self.is_farmer or False,
            "isStudent": self.is_student or False,
            "course": self.course or "",
            "institution": self.institution or "",
            "hasBusiness": self.has_business or False,
            "businessType": self.business_type or "",
            "disabilityType": self.disability_type or "",
            "isTaxPayer": self.is_tax_payer or False,
            "isGovtEmployee": self.is_govt_employee or False,
            "language": self.preferred_language or "en",
            "completenessPercent": self.completeness_percent or 0,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

class ConsentRecord(Base):
    __tablename__ = "consent_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    consent_type = Column(String(100), nullable=False)  # ai_processing, data_storage, profiling
    granted = Column(Boolean, default=False)
    granted_at = Column(DateTime, default=datetime.datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="consents")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")

# ==========================================
# 2. SCHEMES & KNOWLEDGE DOMAIN
# ==========================================

class Scheme(Base):
    __tablename__ = "schemes"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    short_description = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    benefits = Column(Text, nullable=False)
    category = Column(String(100), index=True, nullable=True)
    department = Column(String(255), nullable=True)
    level = Column(String(100), default="Central Scheme")  # Central Scheme / State Scheme
    state = Column(String(100), index=True, default="All India")
    official_source_url = Column(String(500), nullable=False)
    last_verified_date = Column(String(100), default="12 Oct 2026")
    priority = Column(String(50), default="High Priority")  # High Priority, Medium Priority, Low Priority
    deadline = Column(DateTime, nullable=True)
    status = Column(String(50), default="draft", index=True)  # draft, published, archived
    application_status = Column(String(50), default="open", index=True)  # open, closing_soon, closed, upcoming
    application_url = Column(String(500), nullable=True)
    source_url = Column(String(500), nullable=True)
    application_process = Column(Text, nullable=True)
    age_min = Column(Integer, nullable=True)
    age_max = Column(Integer, nullable=True)
    income_max = Column(Float, nullable=True)
    occupation = Column(String(200), nullable=True)
    education = Column(String(200), nullable=True)
    gender = Column(String(50), default="All")  # All, Female, Male, Transgender
    social_category = Column(String(100), default="All")  # All, SC, ST, OBC, General, Minority
    is_farmer_only = Column(Boolean, default=False)
    max_landholding_acres = Column(Float, nullable=True)
    is_student_only = Column(Boolean, default=False)
    is_business_only = Column(Boolean, default=False)
    is_disability_required = Column(Boolean, default=False)
    exclusions = Column(JSON, nullable=True)  # List of strings e.g. ["Income tax payer"]
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    source_verification_status = Column(String(100), default="verified_live")
    last_fetched_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    rules = relationship("SchemeRule", back_populates="scheme", cascade="all, delete-orphan")
    document_requirements = relationship("SchemeDocumentRequirement", back_populates="scheme", cascade="all, delete-orphan")
    source_documents = relationship("SourceDocument", back_populates="scheme", cascade="all, delete-orphan")
    change_logs = relationship("SchemeChangeLog", back_populates="scheme", cascade="all, delete-orphan")
    eligibility_results = relationship("EligibilityResult", back_populates="scheme")

    def to_dict(self, include_rules: bool = True):
        data = {
            "id": self.slug,
            "numericId": self.id,
            "slug": self.slug,
            "name": self.name,
            "shortDescription": self.short_description or (self.description[:120] + "..."),
            "description": self.description,
            "category": self.category or "General",
            "department": self.department or "Government of India",
            "level": self.level or "Central Scheme",
            "state": self.state or "All India",
            "benefit": self.benefits,
            "benefits": self.benefits,
            "officialUrl": self.official_source_url,
            "applicationUrl": self.application_url or self.official_source_url,
            "sourceUrl": self.source_url or self.official_source_url,
            "sourceVerificationStatus": self.source_verification_status or "verified_live",
            "lastFetchedAt": self.last_fetched_at.isoformat() if self.last_fetched_at else None,
            "applicationProcess": self.application_process or "",
            "lastVerifiedDate": self.last_verified_date or "12 Oct 2026",
            "priority": self.priority or "High Priority",
            "status": self.status or ("published" if self.is_active else "draft"),
            "applicationStatus": self.application_status or "open",
            "isActive": self.is_active,
            "ageMin": self.age_min,
            "ageMax": self.age_max,
            "incomeMax": self.income_max,
            "occupation": self.occupation,
            "education": self.education,
            "gender": self.gender or "All",
            "socialCategory": self.social_category or "All",
            "isFarmerOnly": bool(self.is_farmer_only),
            "maxLandholdingAcres": self.max_landholding_acres,
            "isStudentOnly": bool(self.is_student_only),
            "isBusinessOnly": bool(self.is_business_only),
            "isDisabilityRequired": bool(self.is_disability_required),
            "exclusions": self.exclusions or [],
            "createdByAdminId": self.created_by_admin_id,
            "updatedByAdminId": self.updated_by_admin_id,
            "startDate": self.start_date.isoformat() if self.start_date else None,
            "endDate": self.end_date.isoformat() if self.end_date else (self.deadline.isoformat() if self.deadline else None),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "requiredDocuments": [doc.document_name for doc in self.document_requirements] if self.document_requirements else [],
            "eligibilityStatus": "eligible",
            "matchScore": 100,
            "criteria": [],
        }

        if include_rules and self.rules:
            data["criteria"] = [
                {
                    "id": f"c{rule.id}",
                    "name": rule.rule_name or "Eligibility Rule",
                    "condition": rule.rule_description,
                    "passed": True,
                    "userValue": ""
                }
                for rule in self.rules
            ]

        return data

class SchemeRule(Base):
    __tablename__ = "scheme_rules"
    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    rule_name = Column(String(200), nullable=True)
    rule_description = Column(Text, nullable=False)
    rule_logic = Column(JSON, nullable=False)  # Declarative JSON: {"field": "age", "op": "<=", "value": 30}
    is_mandatory = Column(Boolean, default=True)

    scheme = relationship("Scheme", back_populates="rules")

class SchemeDocumentRequirement(Base):
    __tablename__ = "scheme_document_requirements"
    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    document_name = Column(String(150), nullable=False)
    is_mandatory = Column(Boolean, default=True)
    description = Column(Text, nullable=True)

    scheme = relationship("Scheme", back_populates="document_requirements")

class SourceDocument(Base):
    __tablename__ = "source_documents"
    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    title = Column(String(255), nullable=False)
    source_url = Column(String(500), nullable=False)
    document_hash = Column(String(128), nullable=True)
    fetched_at = Column(DateTime, default=datetime.datetime.utcnow)

    scheme = relationship("Scheme", back_populates="source_documents")
    chunks = relationship("SchemeChunk", back_populates="source_document", cascade="all, delete-orphan")

class SchemeChunk(Base):
    __tablename__ = "scheme_chunks"
    id = Column(Integer, primary_key=True, index=True)
    source_document_id = Column(Integer, ForeignKey("source_documents.id"), nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(VectorColumnType, nullable=True)

    source_document = relationship("SourceDocument", back_populates="chunks")

class SchemeChangeLog(Base):
    __tablename__ = "scheme_change_logs"
    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    change_summary = Column(Text, nullable=False)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)

    scheme = relationship("Scheme", back_populates="change_logs")

# ==========================================
# 3. CITIZEN JOURNEY DOMAIN
# ==========================================

class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    language = Column(String(20), default="en")
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    messages = relationship("InterviewMessage", back_populates="session", cascade="all, delete-orphan")
    user = relationship("User", back_populates="interview_sessions")

class InterviewMessage(Base):
    __tablename__ = "interview_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    sender = Column(String(20), nullable=False)  # "user" or "bot"
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("InterviewSession", back_populates="messages")

class EligibilityResult(Base):
    __tablename__ = "eligibility_results"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    status = Column(String(50), nullable=False)  # eligible, almost, ineligible, needs_info
    match_score = Column(Integer, default=0)
    criteria_breakdown = Column(JSON, nullable=True)
    reasoning_text = Column(Text, nullable=True)
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)

    scheme = relationship("Scheme", back_populates="eligibility_results")

class SavedScheme(Base):
    __tablename__ = "saved_schemes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    saved_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="saved_schemes")
    scheme = relationship("Scheme")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "schemeId": self.scheme_id,
            "savedAt": self.saved_at.isoformat() if self.saved_at else None,
        }

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="password_resets")

    def is_valid(self):
        return (not self.used) and (self.expires_at > datetime.datetime.utcnow())

# ==========================================
# 4. DOCUMENTS & APPLICATION DOMAIN
# ==========================================

class UserDocument(Base):
    __tablename__ = "user_documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    doc_key = Column(String(100), nullable=True)      # doc-1, doc-aadhaar, etc.
    name = Column(String(200), nullable=False)        # Aadhaar Card, Income Certificate
    document_type = Column(String(100), nullable=False)
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_size = Column(String(50), nullable=True)
    status = Column(String(50), default="missing")   # uploaded, missing, pending
    is_verified = Column(Boolean, default=False)
    required_for = Column(JSON, nullable=True)       # List of scheme names / slugs
    uploaded_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="documents")
    extracted_fields = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.doc_key or f"doc-{self.id}",
            "numericId": self.id,
            "name": self.name,
            "type": self.document_type,
            "status": self.status,
            "fileName": self.file_name,
            "fileSize": self.file_size,
            "uploadedAt": self.uploaded_at.strftime("%d %b %Y, %I:%M %p") if self.uploaded_at else None,
            "isRequiredFor": self.required_for or [],
            "isVerified": self.is_verified,
        }

class ExtractedField(Base):
    __tablename__ = "extracted_fields"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("user_documents.id"), nullable=False)
    field_name = Column(String(100), nullable=False)
    field_value = Column(String(255), nullable=False)
    confidence = Column(Float, default=1.0)

    document = relationship("UserDocument", back_populates="extracted_fields")

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String(100), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    scheme_name = Column(String(255), nullable=False)
    status = Column(String(50), default="draft")  # draft, submitted, approved, rejected
    applicant_name = Column(String(255), nullable=True)
    father_name = Column(String(255), nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    education = Column(String(100), nullable=True)
    family_income = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="applications")
    fields = relationship("ApplicationField", back_populates="application", cascade="all, delete-orphan")
    affidavit = relationship("Affidavit", back_populates="application", uselist=False, cascade="all, delete-orphan")
    verification_reports = relationship("VerificationReport", back_populates="application", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.application_number,
            "numericId": self.id,
            "schemeId": str(self.scheme_id),
            "schemeName": self.scheme_name,
            "applicantName": self.applicant_name or "",
            "fatherName": self.father_name or "",
            "dateOfBirth": self.date_of_birth or "",
            "education": self.education or "",
            "familyIncome": self.family_income or "",
            "state": self.state or "",
            "district": self.district or "",
            "status": self.status,
            "description": self.description,
            "createdAt": self.created_at.strftime("%d %b %Y") if self.created_at else "",
        }

class ApplicationField(Base):
    __tablename__ = "application_fields"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    field_key = Column(String(100), nullable=False)
    field_value = Column(Text, nullable=False)

    application = relationship("Application", back_populates="fields")

class Affidavit(Base):
    __tablename__ = "affidavits"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True, nullable=False)
    affidavit_pdf_path = Column(String(500), nullable=False)
    is_confirmed_by_user = Column(Boolean, default=False)
    confirmed_at = Column(DateTime, nullable=True)

    application = relationship("Application", back_populates="affidavit")

# ==========================================
# 5. AI INSIGHTS & TELEMETRY
# ==========================================

class VerificationReport(Base):
    __tablename__ = "verification_reports"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    source_verified = Column(Boolean, default=True)
    hallucination_detected = Column(Boolean, default=False)
    confidence_score = Column(Float, default=1.0)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="verification_reports")

class AgentRun(Base):
    __tablename__ = "agent_runs"
    id = Column(Integer, primary_key=True, index=True)
    agent_name = Column(String(100), nullable=False)
    task_id = Column(String(100), nullable=True)
    latency_ms = Column(Float, nullable=False)
    status = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class RetrievalLog(Base):
    __tablename__ = "retrieval_logs"
    id = Column(Integer, primary_key=True, index=True)
    query_text = Column(Text, nullable=False)
    retrieved_chunk_ids = Column(JSON, nullable=False)
    top_score = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
