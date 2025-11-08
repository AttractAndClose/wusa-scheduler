'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, UserButton, useClerk } from '@clerk/nextjs';
import { Calendar, Users, Clock, MapPin, FileText, LogOut, BarChart3, Settings, BookOpen, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/lib/use-admin';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Referral Map', href: '/map', icon: MapPin },
  { name: 'Rep Availability', href: '/availability', icon: Users },
  { name: 'Scheduled Appointments', href: '/appointments', icon: Clock },
  { name: 'Serviceable Zip Codes', href: '/serviceable-zips', icon: FileText },
  { name: 'Zip Demographics', href: '/zip-demographics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const isAdmin = useIsAdmin();
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Sidebar - isAdmin:', isAdmin, 'isLoaded:', isLoaded, 'user:', !!user);
  }

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
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-navy hover:bg-gray-light hover:text-primary'
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
            {/* Admin links - only visible to admins, above user info */}
            {isAdmin && (
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
                {isAdmin && (
                  <p className="text-xs text-navy font-medium truncate mt-0.5">
                    Admin
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
