import prisma from "../prisma";

export async function getInternalUserId(clerkId: ClerkUserId): Promise<InternalUserId | null> {
    const user = await prisma.user.findUnique({
      where: { clerk_id: clerkId },
      select: { id: true }
    });
    return user?.id as InternalUserId || null;
  }
  