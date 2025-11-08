# Clerk Troubleshooting Guide

## Issue: "Create Account" appears instead of Sign In

If you're seeing a "Create Account" prompt when trying to sign in, this usually means:

### 1. The user account doesn't exist in Clerk yet

**Solution: Create the user in Clerk Dashboard**

1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to **Users** in the sidebar
4. Click **+ Create User** button
5. Enter the user details:
   - **Email**: Use the email address (not username)
   - **Password**: Set a password
   - **First Name** / **Last Name**: Optional
6. Click **Create**

**Important Notes:**
- Clerk uses **email addresses**, not usernames, for authentication
- If you have a user with username "admin", you need to know their email address
- Users must be created manually in Clerk Dashboard (sign-up is disabled)

### 2. Check if the user exists

1. Go to Clerk Dashboard → **Users**
2. Search for the email address you're trying to use
3. If the user doesn't exist, create them (see above)

### 3. Verify Clerk Settings

In Clerk Dashboard → **Settings** → **User & Authentication**:

- ✅ **Email/Password** should be enabled
- ✅ **Sign-up** should be **DISABLED** (this prevents new user registration)
- ✅ **Email verification** can be enabled or disabled based on your needs

### 4. Common Issues

**Issue: "User not found"**
- The user account doesn't exist in Clerk
- Create the user in Clerk Dashboard first

**Issue: "Invalid credentials"**
- Double-check the email and password
- Passwords are case-sensitive
- You can reset the password in Clerk Dashboard → Users → Select User → Reset Password

**Issue: Still seeing sign-up form**
- Make sure `signUpUrl={undefined}` is set in the SignIn component (already configured)
- Check Clerk Dashboard settings to ensure sign-up is disabled

## Creating the Admin User

To create the "admin" user:

1. Go to https://dashboard.clerk.com → Your App → **Users**
2. Click **+ Create User**
3. Enter:
   - **Email**: `admin@yourdomain.com` (or the email associated with admin)
   - **Password**: Set a secure password
   - **First Name**: Admin (optional)
4. Click **Create**

Then sign in using the **email address** (not "admin" as username).

## Testing Sign In

1. Go to `/sign-in` page
2. Enter the **email address** (not username) of the user you created
3. Enter the password
4. Click "Sign In"
5. You should be redirected to `/dashboard`

## Need Help?

If you're still having issues:
1. Check Clerk Dashboard → **Users** to verify the user exists
2. Verify the email address matches exactly (case-sensitive)
3. Try resetting the password in Clerk Dashboard
4. Check browser console for any error messages

