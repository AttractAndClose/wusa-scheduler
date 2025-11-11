import { auth, currentUser } from '@clerk/nextjs/server';

const ADMIN_ORG_NAME = 'Windows USA';
const ADMIN_ROLE = 'org:admin';

/**
 * Check if the current user is an admin in the Windows USA organization
 * @returns true if user is an admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { userId, orgId, orgRole, orgSlug } = await auth();
    if (!userId) return false;
    
    // Check if user is in the Windows USA organization with admin role
    if (orgSlug === 'windows-usa' || orgSlug === 'windowsusa' || orgId) {
      // Verify organization name matches (case-insensitive)
      // orgSlug is typically lowercase and hyphenated
      const orgSlugLower = orgSlug?.toLowerCase() || '';
      const matchesOrg = orgSlugLower.includes('windows') && orgSlugLower.includes('usa');
      
      if (matchesOrg && orgRole === ADMIN_ROLE) {
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if the current user's email matches a specific email address
 * @param allowedEmail - The email address to check against (case-insensitive)
 * @returns true if user's email matches, false otherwise
 */
export async function isAuthorizedEmail(allowedEmail: string): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) return false;
    
    // Get the current user's email from Clerk
    const user = await currentUser();
    
    if (!user) return false;
    
    // Check all email addresses (primary and secondary)
    const userEmails = user.emailAddresses.map(email => email.emailAddress.toLowerCase().trim());
    const allowedEmailLower = allowedEmail.toLowerCase().trim();
    
    return userEmails.includes(allowedEmailLower);
  } catch {
    return false;
  }
}

