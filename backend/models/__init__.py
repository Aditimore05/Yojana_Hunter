import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from database import Base

# ==========================================
# 1. USERS & TRUST DOMAIN (5 Tables)
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

    profile = relationship("Profile", back_populates="user", uselist=False)
    consents = relationship("ConsentRecord", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(50), nullable=True)
    occupation = Column(String(100), nullable=True)
    annual_income = Column(Float, nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    category = Column(String(100), nullable=True)  # General, OBC, SC, ST, EWS
    land_holding_acres = Column(Float, default=0.0)
    is_disabled = Column(Boolean, default=False)
    preferred_language = Column(String(20), default="en")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")

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
# 2. SCHEMES & KNOWLEDGE DOMAIN (6 Tables)
# ==========================================

class Scheme(Base):
    __tablename__ = "schemes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    ministry = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    benefits = Column(Text, nullable=False)
    category = Column(String(100), index=True, nullable=True)
    state = Column(String(100), index=True, default="All India")
    official_source_url = Column(String(500), nullable=False)
    deadline = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    rules = relationship("SchemeRule", back_populates="scheme")
    document_requirements = relationship("SchemeDocumentRequirement", back_populates="scheme")
    source_documents = relationship("SourceDocument", back_populates="scheme")
    change_logs = relationship("SchemeChangeLog", back_populates="scheme")

class SchemeRule(Base):
    __tablename__ = "scheme_rules"
    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    rule_description = Column(Text, nullable=False)
    rule_logic = Column(JSON, nullable=False)  # Declarative JSON structure for Rule Engine
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
    chunks = relationship("SchemeChunk", back_populates="source_document")

class SchemeChunk(Base):
    __tablename__ = "scheme_chunks"
    id = Column(Integer, primary_key=True, index=True)
    source_document_id = Column(Integer, ForeignKey("source_documents.id"), nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(384), nullable=True)  # 384-dim embeddings from sentence-transformers

    source_document = relationship("SourceDocument", back_populates="chunks")

class SchemeChangeLog(Base):
    __tablename__ = "scheme_change_logs"
    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    change_summary = Column(Text, nullable=False)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)

    scheme = relationship("Scheme", back_populates="change_logs")

# ==========================================
# 3. CITIZEN JOURNEY DOMAIN (4 Tables)
# ==========================================

class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    language = Column(String(20), default="en")
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    messages = relationship("InterviewMessage", back_populates="session")

class InterviewMessage(Base):
    __tablename__ = "interview_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    sender = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("InterviewSession", back_populates="messages")

class EligibilityResult(Base):
    __tablename__ = "eligibility_results"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    status = Column(String(50), nullable=False)  # eligible, ineligible, needs_info
    criteria_breakdown = Column(JSON, nullable=True)
    reasoning_text = Column(Text, nullable=True)
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)

class SavedScheme(Base):
    __tablename__ = "saved_schemes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    saved_at = Column(DateTime, default=datetime.datetime.utcnow)

# ==========================================
# 4. DOCUMENTS & APPLICATION DOMAIN (5 Tables)
# ==========================================

class UserDocument(Base):
    __tablename__ = "user_documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_type = Column(String(100), nullable=False)
    file_path = Column(String(500), nullable=False)
    is_verified = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    extracted_fields = relationship("ExtractedField", back_populates="document")

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
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    status = Column(String(50), default="draft")  # draft, confirmed, exported
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    fields = relationship("ApplicationField", back_populates="application")
    affidavit = relationship("Affidavit", back_populates="application", uselist=False)
    verification_reports = relationship("VerificationReport", back_populates="application")

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
# 5. AI INSIGHTS & TELEMETRY (3 Tables)
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
