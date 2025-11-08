'use client';

import { useOrganization, useOrganizationList } from '@clerk/nextjs';
import { useMemo } from 'react';

const ADMIN_ROLE = 'org:admin';

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

