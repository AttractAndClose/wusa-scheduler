# Clerk Authentication Setup Guide

## 1. Get Your Clerk API Keys

1. Go to https://dashboard.clerk.com
2. Sign in or create an account
3. Create a new application (or use existing)
4. Go to **API Keys** section
5. Copy your **Publishable Key** and **Secret Key**

## 2. Set Environment Variables

### For Local Development:
Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### For Vercel:
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = your publishable key
   - `CLERK_SECRET_KEY` = your secret key
4. Redeploy your application

## 3. Create Admin User

### Option 1: Via Clerk Dashboard (Recommended)
1. Go to https://dashboard.clerk.com → Your App → Users
2. Click **Create User**
3. Email: `danny@attractandclose.com`
4. Password: `123456`
5. Click **Create**

### Option 2: Via Sign-Up Page
1. Visit your deployed app: `https://your-app.vercel.app/sign-up`
2. Sign up with:
   - Email: `danny@attractandclose.com`
   - Password: `123456`
3. Verify email if required

## 4. Configure Clerk Settings

In Clerk Dashboard → Settings:
- **Email/Password** authentication should be enabled
- **Sign-up** should be enabled (or disabled if you only want admin access)
- Configure email verification as needed

## 5. Test Authentication

1. Visit your app homepage (public, no auth required)
2. Click "Manage Availability" or "View Map" (requires auth)
3. You'll be redirected to `/sign-in`
4. Sign in with your admin credentials
5. You should now have access to protected routes

## Protected Routes

- `/` - Public (booking interface)
- `/availability` - Protected (requires authentication)
- `/map` - Protected (requires authentication)
- `/sign-in` - Public (sign in page)
- `/sign-up` - Public (sign up page)

## Admin Email

The admin email is configured as: `danny@attractandclose.com`

You can modify this in `lib/auth.ts` if needed.

