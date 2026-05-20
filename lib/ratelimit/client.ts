import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url) throw new Error('UPSTASH_REDIS_REST_URL is required');
if (!token) throw new Error('UPSTASH_REDIS_REST_TOKEN is required');

export const redis = new Redis({ url, token });
