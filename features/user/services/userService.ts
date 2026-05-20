import { prisma } from '@/lib/prisma/client';
import { syncUserSchema, type SyncUserInput } from '../schemas/userSchema';

export async function syncUser(input: SyncUserInput) {
  const validated = syncUserSchema.parse(input);

  return prisma.user.upsert({
    where: { clerkId: validated.clerkId },
    update: {
      email: validated.email,
      firstName: validated.firstName,
      lastName: validated.lastName,
      imageUrl: validated.imageUrl,
    },
    create: {
      clerkId: validated.clerkId,
      email: validated.email,
      firstName: validated.firstName,
      lastName: validated.lastName,
      imageUrl: validated.imageUrl,
    },
  });
}
