import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { syncUser } from '@/features/user/services/userService';
import { userSyncLimiter } from '@/lib/ratelimit/limiters';

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { success, limit, remaining, reset } =
      await userSyncLimiter.limit(userId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }

    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email not found' },
        { status: 400 }
      );
    }

    const user = await syncUser({
      clerkId: userId,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    });

    return NextResponse.json({
      success: true,
      data: { user },
      message: 'User synced successfully',
    });
  } catch (error) {
    console.error('[POST /api/v1/user/sync]', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
