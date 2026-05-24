import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './client';

export const userSyncLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'ratelimit:user:sync',
});

// 10 resume creates per minute per user.
// This guards against spam while being generous for normal use.
export const resumeCreateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'ratelimit:resume:create',
});
