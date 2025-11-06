import { auth } from '@clerk/nextjs/server';

const ADMIN_EMAIL = 'danny@attractandclose.com';

export async function isAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) return false;
    
    // In a real app, you'd fetch the user's email from Clerk
    // For now, we'll check this in the component using useUser
    return false; // Placeholder
  } catch {
    return false;
  }
}

