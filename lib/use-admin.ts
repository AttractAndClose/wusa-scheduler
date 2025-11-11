'use client';

import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs';
import { useMemo } from 'react';

const ADMIN_ROLE = 'org:admin';

// Email-based role constants
export const SUPER_ADMIN_EMAIL = 'dan@windowsusa.com';
export const RESTRICTED_ADMIN_EMAIL = 'admin@admin.com';

/**
 * Client-side hook to check if the current user is an admin
 * Checks if user is in Windows USA organization with org:admin role
 */
export function useIsAdmin(): boolean {
  // Check active organization first
  const { organization: activeOrg, membership: activeMembership, isLoaded: orgLoaded } = useOrganization();
  const orgListResult = useOrganizationList({
    userMemberships: true,
  });
  
  // Extract organizationList from the result - Clerk v6 uses userMemberships.data
  const userMemberships = (orgListResult as any).userMemberships;
  const organizationList = userMemberships?.data || [];
  const isLoaded = (orgListResult.isLoaded ?? false) && (orgLoaded ?? false);
  
  return useMemo(() => {
    // Wait for data to load
    if (!isLoaded) {
      return false;
    }
    
    // Check active organization first (if user is currently in an org context)
    if (activeOrg && activeMembership) {
      const orgName = activeOrg.name?.toLowerCase().trim() || '';
      const orgSlug = activeOrg.slug?.toLowerCase().trim() || '';
      const role = activeMembership.role;
      
      const matchesOrg = 
        orgName === 'windows usa' ||
        orgName === 'windows-usa' ||
        orgName === 'windowsusa' ||
        orgSlug === 'windows-usa' ||
        orgSlug === 'windowsusa' ||
        orgSlug === 'windows_usa' ||
        (orgName.includes('windows') && orgName.includes('usa'));
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Active Org Check:', {
          orgName,
          orgSlug,
          role,
          matchesOrg,
          isAdmin: matchesOrg && role === ADMIN_ROLE,
        });
      }
      
      if (matchesOrg && role === ADMIN_ROLE) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ User is admin in active Windows USA org');
        }
        return true;
      }
    }
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Organization List:', organizationList);
      if (organizationList && organizationList.length > 0) {
        organizationList.forEach((org: any, index: number) => {
          console.log(`Org ${index}:`, {
            name: org.organization?.name,
            slug: org.organization?.slug,
            role: org.membership?.role,
            id: org.organization?.id,
          });
        });
      }
    }
    
    // Check all organizations user belongs to
    if (organizationList && organizationList.length > 0) {
      for (const org of organizationList) {
        const orgName = org.organization?.name?.toLowerCase().trim() || '';
        const orgSlug = org.organization?.slug?.toLowerCase().trim() || '';
        const role = org.membership?.role;
        
        // Check for "Windows USA" organization - match exact name or slug variations
        const matchesOrg = 
          orgName === 'windows usa' ||
          orgName === 'windows-usa' ||
          orgName === 'windowsusa' ||
          orgSlug === 'windows-usa' ||
          orgSlug === 'windowsusa' ||
          orgSlug === 'windows_usa' ||
          (orgName.includes('windows') && orgName.includes('usa'));
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('Checking org:', {
            orgName,
            orgSlug,
            role,
            expectedRole: ADMIN_ROLE,
            matchesOrg,
            isAdmin: matchesOrg && role === ADMIN_ROLE,
          });
        }
        
        if (matchesOrg && role === ADMIN_ROLE) {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ User is admin in Windows USA');
          }
          return true;
        }
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ User is NOT admin in Windows USA');
    }
    
    return false;
  }, [organizationList, isLoaded, activeOrg, activeMembership]);
}

/**
 * Client-side hook to check if the current user's email matches a specific email address
 * @param allowedEmail - The email address to check against (case-insensitive)
 * @returns true if user's email matches, false otherwise
 */
export function useIsAuthorizedEmail(allowedEmail: string): boolean {
  const { user, isLoaded } = useUser();
  
  return useMemo(() => {
    if (!isLoaded || !user) {
      return false;
    }
    
    // Check all email addresses (primary and secondary)
    const userEmails = user.emailAddresses.map(email => 
      email.emailAddress.toLowerCase().trim()
    );
    const allowedEmailLower = allowedEmail.toLowerCase().trim();
    
    return userEmails.includes(allowedEmailLower);
  }, [user, isLoaded, allowedEmail]);
}

/**
 * Client-side hook to check if the current user is a super admin (dan@windowsusa.com)
 * Super admins have access to all pages, tools, views, and features
 * @returns true if user is a super admin, false otherwise
 */
export function useIsSuperAdmin(): boolean {
  return useIsAuthorizedEmail(SUPER_ADMIN_EMAIL);
}

/**
 * Client-side hook to check if the current user is a restricted admin (admin@admin.com)
 * Restricted admins have limited access to specific pages only
 * @returns true if user is a restricted admin, false otherwise
 */
export function useIsRestrictedAdmin(): boolean {
  return useIsAuthorizedEmail(RESTRICTED_ADMIN_EMAIL);
}

