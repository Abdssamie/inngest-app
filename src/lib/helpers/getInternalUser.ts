import { User } from "@prisma/client";
import prisma from "../prisma";

export async function getInternalUser(clerkId: ClerkUserId): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { clerk_id: clerkId },
    });

    return user || null;
  }
  