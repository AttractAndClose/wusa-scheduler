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

## 3. Configure Clerk Settings

In Clerk Dashboard → Settings:
- **Email/Password** authentication should be enabled
- **Sign-up** should be **DISABLED** (users must be created manually by admin)
- Configure email verification as needed

## 4. Create Admin User

**Users must be created manually via Clerk Dashboard:**

### Step-by-Step Instructions:

1. Go to https://dashboard.clerk.com
2. Select your application
3. Click **Users** in the left sidebar
4. Click the **+ Create User** button (top right)
5. In the "Create User" modal/form, you should see:
   - **Email address** field (required) - Enter the user's email
   - **Password** field (required) - Set a password
   - **First name** (optional)
   - **Last name** (optional)
6. Fill in the email and password
7. Click **Create** or **Save**

### If Email Field is Missing:

**Make sure Email/Password authentication is enabled:**
1. Go to **Settings** → **User & Authentication**
2. Under **Authentication Methods**, ensure **Email** is enabled
3. If it's not enabled, toggle it on and save
4. Then try creating the user again

### Adding Email to Existing User:

If you already created a user without an email:
1. Go to **Users** → Click on the user
2. Click **Edit** or the pencil icon
3. Add the email address in the email field
4. Save changes

**Note:** Sign-up is disabled. All users must be created by admins through the Clerk dashboard.

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
- `/sign-in` - Public (sign in page only, no sign-up)

## Admin Email

The admin email is configured as: `danny@attractandclose.com`

You can modify this in `lib/auth.ts` if needed.

