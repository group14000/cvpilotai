import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './client';

export const userSyncLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'ratelimit:user:sync',
});
