# exams/cache.py
# Owner: SREEKUTTAN (US-R01)
#
# Local dev-il UPSTASH_REDIS_URL illenkil redis_client = None aakum.
# Production-il Upstash URL undenkil normal-ayi work cheyyum.

import json
import os
import redis

_redis_url = os.environ.get('UPSTASH_REDIS_URL')
redis_client = redis.from_url(_redis_url, decode_responses=True) if _redis_url else None

CACHE_TTL = 21600  # 6 hours


def get_questions_cached(exam_date: str):
    if not redis_client:
        return None
    cache_key = f"exam:questions:{exam_date}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    return None


def warm_question_cache(exam_date: str):
    """Pre-load questions into Redis at 9:45 AM before exam starts."""
    if not redis_client:
        return 0
    from exams.models import Question
    questions = list(Question.objects.filter(exam_date=exam_date).values(
        'id', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'image_url'
    ))
    cache_key = f"exam:questions:{exam_date}"
    redis_client.set(cache_key, json.dumps(questions), ex=CACHE_TTL)
    return len(questions)