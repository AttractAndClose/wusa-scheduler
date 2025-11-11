'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, UserButton, useClerk } from '@clerk/nextjs';
import { Calendar, Users, Clock, MapPin, FileText, LogOut, BarChart3, Settings, BookOpen, LayoutDashboard, Layers, Link2, ChevronDown, ChevronRight, Sparkles, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsAdmin, useIsAuthorizedEmail, useIsSuperAdmin, useIsRestrictedAdmin } from '@/lib/use-admin';

const AUTHORIZED_AFFILIATE_EMAIL = 'dan@windowsusa.com';

function NavDropdown({ item, pathname }: { item: any; pathname: string }) {
  const [isOpen, setIsOpen] = useState(
    item.children?.some((child: any) => pathname === child.href) || false
  );
  const Icon = item.icon;

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'group w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-navy hover:bg-gray-light hover:text-primary',
          item.children?.some((child: any) => pathname === child.href) && 'bg-gray-light text-primary'
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-navy group-hover:text-primary" />
          {item.name}
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {item.children.map((child: any) => {
            const ChildIcon = child.icon;
            return (
              <Link
                key={child.name}
                href={child.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-navy/70 hover:bg-gray-light hover:text-primary',
                  pathname === child.href && 'bg-gray-light text-primary font-semibold'
                )}
              >
                <ChildIcon className="h-4 w-4" />
                {child.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Referral Map', href: '/map', icon: MapPin },
  { name: 'Territory Map', href: '/territory-map', icon: Layers },
  { name: 'Rep Availability', href: '/availability', icon: Users },
  { name: 'Scheduled Appointments', href: '/appointments', icon: Clock },
  { name: 'Serviceable Zip Codes', href: '/serviceable-zips', icon: FileText },
  { name: 'Zip Demographics', href: '/zip-demographics', icon: BarChart3 },
  { 
    name: 'Affiliate Management', 
    icon: Link2, 
    requiresAuth: true,
    children: [
      { name: 'Affiliate Partners', href: '/affiliate-management/partners', icon: Building2 },
      { name: 'Performance Reports', href: '/affiliate-management/performance', icon: BarChart3 },
    ]
  },
  { name: 'AI Analysis', href: '/ai-analysis', icon: Sparkles, requiresAuth: true },
];

// Pages allowed for restricted admin (admin@admin.com)
const RESTRICTED_ADMIN_ALLOWED_PAGES = [
  '/schedule',
  '/map',
  '/availability',
  '/appointments',
  '/documentation',
  '/settings',
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const isSuperAdmin = useIsSuperAdmin();
  const isRestrictedAdmin = useIsRestrictedAdmin();
  const isAuthorizedForAffiliate = useIsAuthorizedEmail(AUTHORIZED_AFFILIATE_EMAIL);
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Sidebar - isAdmin:', isAdmin, 'isSuperAdmin:', isSuperAdmin, 'isRestrictedAdmin:', isRestrictedAdmin, 'isLoaded:', isLoaded, 'user:', !!user);
  }
  
  // Helper function to check if a navigation item should be visible
  const isNavigationItemVisible = (item: any): boolean => {
    // Super admin sees everything
    if (isSuperAdmin) {
      return true;
    }
    
    // Restricted admin only sees allowed pages
    if (isRestrictedAdmin) {
      // Check if this is a direct link
      if (item.href) {
        return RESTRICTED_ADMIN_ALLOWED_PAGES.includes(item.href);
      }
      // Check if this is a dropdown with children
      if (item.children) {
        // For dropdowns, check if any child is allowed
        return item.children.some((child: any) => 
          RESTRICTED_ADMIN_ALLOWED_PAGES.includes(child.href)
        );
      }
      return false;
    }
    
    // For other users, check requiresAuth flag
    if (item.requiresAuth && !isAuthorizedForAffiliate) {
      return false;
    }
    
    // Default: show item
    return true;
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r-2 border-navy shadow-sm">
      {/* Logo - Centered */}
      <div className="flex h-16 items-center justify-center px-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center">
          <img
            src="/windowsusa-logo.png"
            alt="Windows USA"
            className="h-10 w-auto"
          />
        </Link>
      </div>

      {/* Navigation - No highlight style */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          
          // Check if item should be visible based on user role
          if (!isNavigationItemVisible(item)) {
            return null;
          }

          // Handle dropdown items
          if (item.children) {
            // For restricted admin, filter children to only show allowed pages
            let filteredChildren = item.children;
            if (isRestrictedAdmin && !isSuperAdmin) {
              filteredChildren = item.children.filter((child: any) =>
                RESTRICTED_ADMIN_ALLOWED_PAGES.includes(child.href)
              );
              // If no children are allowed, don't show the dropdown
              if (filteredChildren.length === 0) {
                return null;
              }
            }
            return (
              <NavDropdown key={item.name} item={{ ...item, children: filteredChildren }} pathname={pathname} />
            );
          }
          
          return (
            <Link
              key={item.name}
              href={item.href!}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-navy hover:bg-gray-light hover:text-primary',
                pathname === item.href && 'bg-gray-light text-primary'
              )}
            >
              <Icon className="h-5 w-5 text-navy group-hover:text-primary" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {isLoaded && (
        user ? (
          <div className="border-t border-gray-200 p-4 space-y-3">
            {/* Documentation and Settings links - visible to super admin, restricted admin, and regular admins */}
            {(isSuperAdmin || isRestrictedAdmin || isAdmin) && (
              <>
                <Link
                  href="/documentation"
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-navy hover:bg-gray-light hover:text-primary mb-3'
                  )}
                >
                  <BookOpen className="h-5 w-5 text-navy group-hover:text-primary" />
                  Documentation
                </Link>
                <Link
                  href="/settings"
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-navy hover:bg-gray-light hover:text-primary mb-3'
                  )}
                >
                  <Settings className="h-5 w-5 text-navy group-hover:text-primary" />
                  Settings
                </Link>
              </>
            )}
            
            {/* User Info with Clickable UserButton */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'h-10 w-10 cursor-pointer',
                      userButtonPopoverCard: 'shadow-lg',
                    }
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy truncate">
                  {user.firstName || user.lastName 
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : user.emailAddresses[0]?.emailAddress || 'User'
                  }
                </p>
                {user.emailAddresses[0]?.emailAddress && (
                  <p className="text-xs text-navy/70 truncate">
                    {user.emailAddresses[0].emailAddress}
                  </p>
                )}
                {(isAdmin || isSuperAdmin || isRestrictedAdmin) && (
                  <p className="text-xs text-navy font-medium truncate mt-0.5">
                    {isSuperAdmin ? 'Super Admin' : isRestrictedAdmin ? 'Admin' : 'Admin'}
                  </p>
                )}
              </div>
            </div>

            {/* Logout Link */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full text-sm text-navy hover:text-primary transition-colors px-2 py-1.5 rounded hover:bg-gray-light"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <div className="border-t border-gray-200 p-4">
            <Link
              href="/sign-in"
              className="flex items-center justify-center gap-2 w-full text-sm text-navy hover:text-primary transition-colors px-2 py-1.5 rounded hover:bg-gray-light"
            >
              <span>Sign In</span>
            </Link>
          </div>
        )
      )}
    </div>
  );
}
