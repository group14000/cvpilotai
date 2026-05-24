import { OpenRouter } from '@openrouter/sdk';

// ─── Global singleton guard ───────────────────────────────────────────────────
//
// Mirrors the pattern in lib/prisma/client.ts — prevents duplicate OpenRouter
// client instances during Next.js hot-reload in development.
//
// This file is SERVER-ONLY. Never add "use client". The OPENROUTER_API_KEY
// must never be exposed to the browser bundle.
// ─────────────────────────────────────────────────────────────────────────────

const globalForOpenRouter = global as unknown as {
  openRouter: OpenRouter | undefined;
};

// Validate required env variable at module initialization (CLAUDE.md rule 7).
// Fail loudly and early rather than silently returning undefined at call time.
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is not set. Add it to your .env file.');
}

export const openRouterClient: OpenRouter =
  globalForOpenRouter.openRouter ??
  new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

// In development, store on global to survive hot-reload without creating
// multiple instances (same technique used for Prisma client).
if (process.env.NODE_ENV !== 'production') {
  globalForOpenRouter.openRouter = openRouterClient;
}
