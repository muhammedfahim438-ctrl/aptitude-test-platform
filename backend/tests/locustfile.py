# tests/locustfile.py
# Owner: SREEKUTTAN (US-R04)
#
# Simulates 2,000 concurrent users hitting question/submit endpoints.
# Models real exam-day burst: heavy read load (get_questions) +
# submission spike at exam close.
#
# Run:
#   locust -f tests/locustfile.py --host=https://your-api.onrender.com \
#     --users=2000 --spawn-rate=100 --run-time=5m \
#     --html=docs/benchmarks/locust_report.html
#
# Pass criteria (per US-R04 AC):
#   - 0% failure rate
#   - p95 < 200ms  (Redis-served question reads)
#   - p99 < 500ms

from locust import HttpUser, task, between, events
from datetime import date
import random
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Realistic answer payload — simulates a student who answered all questions.
# Real exam has more than 3 questions; using 10 here as a representative set.
# Expand to match actual Question count once DB is seeded.
# ---------------------------------------------------------------------------
ANSWER_OPTIONS = ["A", "B", "C", "D"]

def make_answers(n=10):
    """Generate n random answers — simulates a student completing the exam."""
    return {f"q{i}": random.choice(ANSWER_OPTIONS) for i in range(1, n + 1)}


# ---------------------------------------------------------------------------
# Test user pool — each virtual user picks a unique email from this pool
# so we don't hammer the DB with 2000 sessions for a single account.
# In a real load test run: seed 2000 test student accounts beforehand.
# ---------------------------------------------------------------------------
USER_POOL_SIZE = 2000

def get_test_credentials(user_id: int):
    """
    Returns credentials for virtual user N.
    Seed these accounts in DB before running:
      python manage.py shell -c "
        from accounts.models import CustomUser
        for i in range(1, 2001):
            CustomUser.objects.get_or_create(
                email=f'student{i}@test.com',
                defaults={'full_name': f'Test Student {i}',
                          'is_student': True,
                          'roll_number': f'ROLL{i:04d}'}
            )[0].set_password('testpass123') or \
            CustomUser.objects.filter(email=f'student{i}@test.com').first().save()
      "
    """
    return {
        "email": f"student{user_id}@test.com",
        "password": "testpass123",
    }


# ---------------------------------------------------------------------------
# Virtual user class
# ---------------------------------------------------------------------------

class ExamStudent(HttpUser):
    """
    Models a real exam-day student:
      - Logs in once on spawn (on_start)
      - Reads questions repeatedly during exam (task weight 4)
      - Submits answers once near exam close (task weight 1)
      - Pings health endpoint occasionally (task weight 1)

    Task ratio 4:1:1 matches expected real traffic pattern:
    students reload questions multiple times, submit once.
    """
    wait_time = between(0.5, 2)  # Realistic think-time between actions

    def on_start(self):
        """Login once per virtual user. Skip all tasks if login fails."""
        self.token = None
        self.exam_date = date.today().isoformat()

        # Pick a unique user from the pool — wraps around if >USER_POOL_SIZE spawned
        user_id = (self.environment.runner.user_count % USER_POOL_SIZE) + 1
        creds = get_test_credentials(user_id)

        with self.client.post(
            "/api/auth/login/",
            json=creds,
            catch_response=True,
            name="/api/auth/login/"
        ) as resp:
            if resp.status_code == 200:
                self.token = resp.json().get("access")
                resp.success()
            else:
                logger.warning(f"[LOCUST] Login failed for {creds['email']}: {resp.status_code}")
                resp.failure(f"Login failed: {resp.status_code}")

    def _auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    # -----------------------------------------------------------------------
    # Task 1 — Question read (weight 4: most frequent action during exam)
    # -----------------------------------------------------------------------
    @task(4)
    def get_questions(self):
        """
        Simulates the heavy read burst — 2000 students loading questions.
        During exam window: should be Redis-served, p95 < 200ms.
        503 during exam window = cache miss = legitimate failure → mark as failure.
        """
        if not self.token:
            return  # Skip if login failed — don't pollute failure stats

        with self.client.get(
            f"/api/tests/questions/?date={self.exam_date}",
            headers=self._auth_headers(),
            catch_response=True,
            name="/api/tests/questions/"
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code == 503:
                # Cache miss during exam window — this is a real failure
                resp.failure("503: Cache miss during exam window — Redis not warm")
            else:
                resp.failure(f"Unexpected status: {resp.status_code}")

    # -----------------------------------------------------------------------
    # Task 2 — Answer submission (weight 1: happens once per student at close)
    # -----------------------------------------------------------------------
    @task(1)
    def submit_answers(self):
        """
        Simulates the submission burst at 2:00 PM (exam close).
        update_or_create ensures idempotency — re-runs don't create duplicates.
        409 = window closed (expected after 2 PM) → not a failure.
        """
        if not self.token:
            return

        with self.client.post(
            "/api/tests/submit/",
            json={
                "exam_date": self.exam_date,
                "answers": make_answers(n=10),
            },
            headers=self._auth_headers(),
            catch_response=True,
            name="/api/tests/submit/"
        ) as resp:
            if resp.status_code in (200, 201):
                resp.success()
            elif resp.status_code == 409:
                # Window closed — expected behaviour after 2 PM, not a failure
                resp.success()
            else:
                resp.failure(f"Submit failed: {resp.status_code} — {resp.text[:100]}")

    # -----------------------------------------------------------------------
    # Task 3 — Health check (weight 1: keep-alive verification)
    # -----------------------------------------------------------------------
    @task(1)
    def health_check(self):
        """
        Zero-auth, zero-DB endpoint (Constraint 6).
        Verifies Render worker is awake — should always be < 50ms.
        """
        with self.client.get(
            "/api/health/",
            catch_response=True,
            name="/api/health/"
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Health check failed: {resp.status_code}")


# ---------------------------------------------------------------------------
# Event hooks — print pass/fail summary after test run
# ---------------------------------------------------------------------------

@events.quitting.add_listener
def on_quitting(environment, **kwargs):
    """
    Prints a pass/fail verdict against US-R04 acceptance criteria.
    Check this in the terminal after the run completes.
    """
    stats = environment.runner.stats.total
    p95 = stats.get_response_time_percentile(0.95)
    p99 = stats.get_response_time_percentile(0.99)
    failure_rate = (stats.num_failures / stats.num_requests * 100) if stats.num_requests else 0

    print("\n" + "="*55)
    print("  US-R04 LOAD TEST RESULTS")
    print("="*55)
    print(f"  Total requests : {stats.num_requests}")
    print(f"  Failures       : {stats.num_failures} ({failure_rate:.2f}%)")
    print(f"  p95 latency    : {p95:.0f}ms  (target: <200ms)")
    print(f"  p99 latency    : {p99:.0f}ms  (target: <500ms)")
    print("-"*55)

    passed = True
    if failure_rate > 0:
        print("  ❌ FAIL — failure rate > 0%")
        passed = False
    if p95 and p95 > 200:
        print(f"  ❌ FAIL — p95 {p95:.0f}ms exceeds 200ms target")
        passed = False
    if p99 and p99 > 500:
        print(f"  ❌ FAIL — p99 {p99:.0f}ms exceeds 500ms target")
        passed = False
    if passed:
        print("  ✅ PASS — all criteria met")
    print("="*55 + "\n")