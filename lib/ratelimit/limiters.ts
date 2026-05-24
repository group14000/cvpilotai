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

// 10 resume updates per minute per user.
// PATCH writes data to DB — same cost class as POST creates.
export const resumeUpdateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'ratelimit:resume:update',
});

// 10 resume deletes per minute per user.
// Cheap DB operation but we still guard against bulk deletion abuse.
export const resumeDeleteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'ratelimit:resume:delete',
});

// 5 AI optimization requests per hour per user.
//
// Reasoning:
//   - DeepSeek V4 Flash free tier: ~200 req/day account-wide.
//     At 5/hr/user, just 40 concurrent active users saturates the daily
//     quota — this forces migration to a paid tier before real scale.
//   - Each call: ~3,000–5,000 input tokens + ~1,500 output tokens.
//   - Legitimate use: 2–3 job applications per session. 5/hr is generous.
//   - Sliding window prevents boundary-burst attacks.
//
// Redis key prefix: ratelimit:ai:optimize:<userId>
export const aiOptimizeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'ratelimit:ai:optimize',
});
