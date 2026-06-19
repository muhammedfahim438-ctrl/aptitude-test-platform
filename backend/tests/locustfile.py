# tests/locustfile.py
# Owner: SREEKUTTAN (US-R04)
# Simulates 2,000 concurrent users hitting question/submit endpoints.
#
# Run: locust -f tests/locustfile.py --host=https://your-api.onrender.com \
#        --users=2000 --spawn-rate=100 --run-time=5m --html=docs/benchmarks/locust_report.html
#
# Pass criteria: 0% failure rate, p95 < 200ms, p99 < 500ms

from locust import HttpUser, task, between
from datetime import date


class ExamStudent(HttpUser):
    wait_time = between(0.5, 2)
    token = None

    def on_start(self):
        resp = self.client.post(
            "/api/auth/login/",
            json={"email": "testuser@college.edu", "password": "testpass123"}
        )
        self.token = resp.json().get("access")

    @task(3)
    def get_questions(self):
        self.client.get(
            f"/api/tests/questions/?date={date.today().isoformat()}",
            headers={"Authorization": f"Bearer {self.token}"}
        )

    @task(1)
    def submit_answers(self):
        self.client.post(
            "/api/tests/submit/",
            json={
                "exam_date": date.today().isoformat(),
                "answers": {"q1": "A", "q2": "B", "q3": "C"}
            },
            headers={"Authorization": f"Bearer {self.token}"}
        )
