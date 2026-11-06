import time
import asyncio
from typing import Dict, Tuple
from app.core.config import settings

class TokenBucketRateLimiter:
    """
    Dual-mode rate limiter: Uses Redis when connected,
    falls back seamlessly to in-memory sliding window when Redis is unavailable.
    """
    def __init__(self):
        self._memory_store: Dict[str, list] = {}
        self._lock = asyncio.Lock()
        self._redis_client = None

    def _get_redis(self):
        if self._redis_client is None:
            try:
                import redis
                client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                client.ping()
                self._redis_client = client
            except Exception:
                self._redis_client = False
        return self._redis_client if self._redis_client is not False else None

    async def check_rate_limit(self, key: str, max_requests: int = 60, window_seconds: int = 60) -> Tuple[bool, int]:
        """
        Returns (is_allowed, remaining_requests)
        """
        r = self._get_redis()
        current_time = time.time()
        
        if r:
            try:
                pipeline = r.pipeline()
                bucket_key = f"ratelimit:{key}"
                pipeline.zremrangebyscore(bucket_key, 0, current_time - window_seconds)
                pipeline.zcard(bucket_key)
                pipeline.zadd(bucket_key, {str(current_time): current_time})
                pipeline.expire(bucket_key, window_seconds)
                results = pipeline.execute()
                
                request_count = results[1]
                if request_count < max_requests:
                    return True, max(0, max_requests - request_count - 1)
                else:
                    return False, 0
            except Exception:
                pass # Fallback to in-memory

        async with self._lock:
            timestamps = self._memory_store.get(key, [])
            # filter out timestamps older than window
            cutoff = current_time - window_seconds
            timestamps = [ts for ts in timestamps if ts > cutoff]
            
            if len(timestamps) < max_requests:
                timestamps.append(current_time)
                self._memory_store[key] = timestamps
                return True, max_requests - len(timestamps)
            else:
                self._memory_store[key] = timestamps
                return False, 0


rate_limiter = TokenBucketRateLimiter()
