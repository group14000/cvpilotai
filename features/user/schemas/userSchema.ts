import { z } from 'zod';

export const syncUserSchema = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  imageUrl: z.string().nullable(),
});

export type SyncUserInput = z.infer<typeof syncUserSchema>;
