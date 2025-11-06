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
  // Get Clerk keys - use empty string fallback to prevent build errors
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  
  // Always render html/body structure to ensure CSS loads
  // CSS import at top ensures it's always included
  if (!publishableKey) {
    return (
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>{children}</body>
      </html>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signUpUrl={undefined}
      signInUrl="/sign-in"
      afterSignInUrl="/"
      afterSignOutUrl="/"
    >
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}

