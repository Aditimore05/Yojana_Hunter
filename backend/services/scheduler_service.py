import time
import logging
import threading
import datetime
from typing import Dict, Any, Optional

from database import SessionLocal
from models import DiscoverySchedule
from services.discovery_service import DiscoveryService

logger = logging.getLogger(__name__)


class SchedulerService:
    """
    Manages automated scheduled background scheme discovery runs.
    Ensures persistent state in PostgreSQL, single-instance execution,
    and graceful error handling without requiring active browser tabs.
    """

    _scheduler_thread: Optional[threading.Thread] = None
    _stop_event = threading.Event()
    _lock = threading.Lock()

    @classmethod
    def get_or_create_schedule(cls, db) -> DiscoverySchedule:
        """Retrieves or initializes the singleton schedule record in PostgreSQL."""
        schedule = db.query(DiscoverySchedule).first()
        if not schedule:
            schedule = DiscoverySchedule(
                is_enabled=False,
                frequency_hours=24,
                parameters={
                    "state": "All India",
                    "category": "All",
                    "max_queries": 4
                },
                last_run_at=None,
                next_run_at=datetime.datetime.utcnow() + datetime.timedelta(hours=24),
                last_job_id=None,
                last_status="idle",
                updated_at=datetime.datetime.utcnow()
            )
            db.add(schedule)
            db.commit()
            db.refresh(schedule)
        return schedule

    @classmethod
    def get_schedule_info(cls) -> Dict[str, Any]:
        """Returns current scheduler configuration and execution status."""
        db = SessionLocal()
        try:
            sched = cls.get_or_create_schedule(db)
            data = sched.to_dict()
            data["isJobRunning"] = DiscoveryService.is_job_running()
            data["activeJobId"] = DiscoveryService.get_active_job_id()
            return data
        finally:
            db.close()

    @classmethod
    def update_schedule(
        cls,
        is_enabled: Optional[bool] = None,
        frequency_hours: Optional[int] = None,
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Updates scheduler frequency, parameters, and active state."""
        db = SessionLocal()
        try:
            sched = cls.get_or_create_schedule(db)
            now = datetime.datetime.utcnow()

            if is_enabled is not None:
                sched.is_enabled = bool(is_enabled)
                if sched.is_enabled:
                    # If turning on and next_run is missing or past, schedule next run
                    if not sched.next_run_at or sched.next_run_at < now:
                        sched.next_run_at = now + datetime.timedelta(hours=sched.frequency_hours or 24)
                else:
                    sched.last_status = "disabled"

            if frequency_hours is not None and frequency_hours > 0:
                sched.frequency_hours = int(frequency_hours)
                # Recalculate next run if enabled
                if sched.is_enabled:
                    sched.next_run_at = (sched.last_run_at or now) + datetime.timedelta(hours=sched.frequency_hours)
                    if sched.next_run_at < now:
                        sched.next_run_at = now + datetime.timedelta(minutes=5)

            if parameters is not None:
                sched.parameters = parameters

            sched.updated_at = now
            db.commit()
            db.refresh(sched)
            logger.info(f"Updated discovery schedule: enabled={sched.is_enabled}, frequency={sched.frequency_hours}h, next_run={sched.next_run_at}")
            return sched.to_dict()
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update discovery schedule: {e}")
            raise
        finally:
            db.close()

    @classmethod
    def trigger_scheduled_run(cls, reason: str = "scheduled_interval") -> Dict[str, Any]:
        """Executes a scheduled discovery run if no job is actively executing."""
        if DiscoveryService.is_job_running():
            logger.warning("Scheduled discovery skipped because another discovery job is already active.")
            return {
                "success": False,
                "skipped": True,
                "message": "Another discovery job is currently in progress. Skipping overlapping execution."
            }

        # 1. Read current schedule configuration
        db = SessionLocal()
        try:
            sched = cls.get_or_create_schedule(db)
            params = dict(sched.parameters or {
                "state": "All India",
                "category": "All",
                "max_queries": 4
            })
            frequency_hours = int(sched.frequency_hours or 24)
            schedule_id = sched.id
        finally:
            db.close()

        # 2. Launch background discovery job
        result = DiscoveryService.start_discovery_job(
            parameters=params,
            admin_user_id=None
        )

        # 3. Record execution state in fresh session
        now = datetime.datetime.utcnow()
        db = SessionLocal()
        try:
            sched = db.query(DiscoverySchedule).filter(DiscoverySchedule.id == schedule_id).first()
            if sched:
                if result.get("success"):
                    sched.last_run_at = now
                    sched.last_job_id = result.get("jobId")
                    sched.last_status = "running"
                    sched.next_run_at = now + datetime.timedelta(hours=frequency_hours)
                    sched.updated_at = now
                    db.commit()
                    logger.info(f"Triggered scheduled discovery run {result.get('jobId')}. Next run scheduled at {sched.next_run_at}")
                else:
                    sched.last_status = "failed_to_start"
                    db.commit()
        except Exception as se:
            db.rollback()
            logger.error(f"Failed to record schedule run timestamp: {se}")
        finally:
            db.close()

        return result

    @classmethod
    def start_scheduler_thread(cls):
        """Initializes the background scheduler worker thread."""
        with cls._lock:
            if cls._scheduler_thread is not None and cls._scheduler_thread.is_alive():
                return

            cls._stop_event.clear()
            cls._scheduler_thread = threading.Thread(
                target=cls._scheduler_loop,
                daemon=True,
                name="DiscoverySchedulerThread"
            )
            cls._scheduler_thread.start()
            logger.info("Discovery background scheduler daemon thread started successfully.")

    @classmethod
    def _scheduler_loop(cls):
        """Continuous background loop checking schedule intervals."""
        while not cls._stop_event.is_set():
            try:
                db = SessionLocal()
                try:
                    sched = cls.get_or_create_schedule(db)
                    now = datetime.datetime.utcnow()

                    if sched.is_enabled and sched.next_run_at and now >= sched.next_run_at:
                        logger.info(f"Schedule due (now={now}, next_run={sched.next_run_at}). Launching scheduled discovery...")
                        cls.trigger_scheduled_run(reason="due_interval")
                finally:
                    db.close()
            except Exception as e:
                logger.error(f"Error in discovery scheduler loop: {e}")

            # Sleep 30 seconds between schedule checks
            cls._stop_event.wait(30.0)
