import { auth } from '@clerk/nextjs/server';

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

