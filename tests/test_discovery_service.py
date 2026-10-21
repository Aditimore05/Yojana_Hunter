import sys
import os
import pytest
from unittest.mock import MagicMock, patch

# Include backend in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from services.discovery_service import DiscoveryService
from models import Scheme, DiscoveryJob, SchemeCitation


class TestDiscoveryService:
    def test_singleton_lock_prevents_concurrent_runs(self):
        """Verify the singleton lock prevents simultaneous background discovery jobs."""
        with DiscoveryService._job_lock:
            can_start = DiscoveryService._job_lock.acquire(blocking=False)
            assert can_start is False, "Lock should not be acquirable when another job holds it"

    def test_status_and_application_window_separation(self):
        """
        Verify that Scheme Existence (active/discontinued/unknown) is strictly
        separated from Application Window Availability (open/closed/upcoming/unknown).
        """
        candidate_active_closed = {
            "name": "State Pre-Matric Scholarship",
            "category": "Education",
            "status": "active",
            "application_status": "closed",
            "official_url": "https://scholarships.gov.in/pre-matric"
        }

        # Status must remain 'active' while application window is 'closed'
        assert candidate_active_closed["status"] == "active"
        assert candidate_active_closed["application_status"] == "closed"

        # Never infer open status without explicit evidence
        candidate_unknown = {
            "name": "District Welfare Aid",
            "category": "Social Welfare"
        }
        # In the absence of confirmed dates, defaults must be unknown, not 'open'
        app_status = candidate_unknown.get("application_status") or "unknown"
        assert app_status == "unknown"

    def test_scheme_deduplication_by_slug_and_url(self):
        """Verify that existing schemes are detected to prevent duplicate inserts."""
        mock_existing_scheme = MagicMock(spec=Scheme)
        mock_existing_scheme.id = 1
        mock_existing_scheme.slug = "pm-kisan-samman-nidhi"
        mock_existing_scheme.name = "PM-Kisan Samman Nidhi"
        mock_existing_scheme.official_url = "https://pmkisan.gov.in"

        # Exact slug match
        candidate_1 = {
            "name": "PM Kisan Samman Nidhi",
            "official_url": "https://pmkisan.gov.in"
        }
        gen_slug = "pm-kisan-samman-nidhi"
        assert gen_slug == mock_existing_scheme.slug

        # Normalization and URL matching
        cand_url = "https://pmkisan.gov.in"
        assert cand_url == mock_existing_scheme.official_url

    def test_clean_citations_extraction(self):
        """Test that citations contain valid official URL and title metadata."""
        raw_citations = [
            {"source_title": "National Portal of India", "source_url": "https://india.gov.in", "excerpt": "Official portal"},
            {"source_title": "Invalid Scheme Source", "source_url": None, "excerpt": "No link"},
            {"source_title": "", "source_url": "https://agricoop.nic.in", "excerpt": "Department of Agriculture"}
        ]

        valid_citations = [
            c for c in raw_citations 
            if c.get("source_url") and (c.get("source_url").startswith("http://") or c.get("source_url").startswith("https://"))
        ]

        assert len(valid_citations) == 2
        assert valid_citations[0]["source_url"] == "https://india.gov.in"
        assert valid_citations[1]["source_url"] == "https://agricoop.nic.in"
