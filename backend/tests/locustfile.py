from locust import HttpUser, task, between, events
from datetime import date
import random
import logging

logger = logging.getLogger(__name__)

ANSWER_OPTIONS = ["A", "B", "C", "D"]


def make_answers(n=10):
    return {f"q{i}": random.choice(ANSWER_OPTIONS) for i in range(1, n + 1)}


USER_POOL_SIZE = 2000


def get_test_credentials(user_id: int):
    return {
        "email": f"student{user_id}@test.com",
        "password": "testpass123",
    }


class ExamStudent(HttpUser):
    wait_time = between(0.5, 2)

    def on_start(self):
        self.token = None
        self.exam_date = date.today().isoformat()

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

    @task(4)
    def get_questions(self):
        if not self.token:
            return

        with self.client.get(
            f"/api/tests/questions/?date={self.exam_date}",
            headers=self._auth_headers(),
            catch_response=True,
            name="/api/tests/questions/"
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code == 503:
                resp.failure("503: Cache miss during exam window")
            else:
                resp.failure(f"Unexpected status: {resp.status_code}")

    @task(1)
    def submit_answers(self):
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
                resp.success()
            else:
                resp.failure(f"Submit failed: {resp.status_code} - {resp.text[:100]}")

    @task(1)
    def health_check(self):
        with self.client.get(
            "/api/health/",
            catch_response=True,
            name="/api/health/"
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Health check failed: {resp.status_code}")


@events.quitting.add_listener
def on_quitting(environment, **kwargs):
    stats = environment.runner.stats.total
    p95 = stats.get_response_time_percentile(0.95)
    p99 = stats.get_response_time_percentile(0.99)
    failure_rate = (stats.num_failures / stats.num_requests * 100) if stats.num_requests else 0

    print("\n" + "=" * 55)
    print("  LOAD TEST RESULTS")
    print("=" * 55)
    print(f"  Total requests : {stats.num_requests}")
    print(f"  Failures       : {stats.num_failures} ({failure_rate:.2f}%)")
    print(f"  p95 latency    : {p95:.0f}ms  (target: <200ms)")
    print(f"  p99 latency    : {p99:.0f}ms  (target: <500ms)")
    print("-" * 55)

    passed = True
    if failure_rate > 0:
        print("  FAIL - failure rate > 0%")
        passed = False
    if p95 and p95 > 200:
        print(f"  FAIL - p95 {p95:.0f}ms exceeds 200ms target")
        passed = False
    if p99 and p99 > 500:
        print(f"  FAIL - p99 {p99:.0f}ms exceeds 500ms target")
        passed = False
    if passed:
        print("  PASS - all criteria met")
    print("=" * 55 + "\n")
