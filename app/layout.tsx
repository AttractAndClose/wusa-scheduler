import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sales Appointment Scheduler',
  description: 'Intelligent appointment scheduling based on geographic proximity',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Only render ClerkProvider if keys are available (prevents build errors)
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.warn('Clerk publishable key not found. Authentication will not work.');
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <ClerkProvider
      signUpUrl={undefined}
      signInUrl="/sign-in"
      afterSignInUrl="/"
      afterSignOutUrl="/"
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}

