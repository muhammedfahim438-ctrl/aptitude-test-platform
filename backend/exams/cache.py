# exams/cache.py
import json
import os

import redis

redis_client = redis.from_url(os.environ['UPSTASH_REDIS_URL'], decode_responses=True)
CACHE_TTL = 21600  # 6 hours


def get_questions_cached(exam_date: str):
    """Returns cached question list for exam_date, or None on cache miss."""
    cache_key = f"exam:questions:{exam_date}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    return None


def warm_question_cache(exam_date: str):
    """
    Pre-loads questions into Redis ahead of the exam window.
    Triggered by cron-job.org at 9:45 AM, 15 min before the 10 AM exam start.
    Returns the count of questions loaded (0 if none found for that date).
    """
    from exams.models import Question

    questions = list(Question.objects.filter(exam_date=exam_date).values(
        'id', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'image_url'
    ))
    cache_key = f"exam:questions:{exam_date}"
    redis_client.set(cache_key, json.dumps(questions), ex=CACHE_TTL)
    return len(questions)
