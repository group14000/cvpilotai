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

// 30 list/single reads per minute per user.
// Read operations are cheaper than writes; a more permissive limit here
// keeps the UI snappy without opening up abuse vectors.
// Shared between GET /api/v1/resumes and GET /api/v1/resumes/[id].
export const resumeListLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix: 'ratelimit:resume:list',
});

// 5 PDF exports per hour per user.
// PDF generation launches a full Chromium instance (~200ms–2s per request).
// Keeping this strict prevents abuse of the expensive compute operation.
export const resumeExportLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'ratelimit:resume:export',
});
