# How to Create a User with Email in Clerk

## Quick Steps

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Select your application**
3. **Click "Users"** in the left sidebar
4. **Click "+ Create User"** button (usually top-right)
5. **Fill in the form:**
   - **Email address** (required) - This is what they'll use to sign in
   - **Password** (required)
   - First name (optional)
   - Last name (optional)
6. **Click "Create"**

## If You Don't See Email Field

### Check Authentication Settings:

1. Go to **Settings** → **User & Authentication**
2. Under **Authentication Methods**, make sure **Email** is enabled
3. If Email is disabled:
   - Toggle it ON
   - Save changes
   - Go back to Users and try creating again

### Alternative: Edit Existing User

If you already created a user but didn't add email:

1. Go to **Users** → Find your user
2. Click on the user to open their profile
3. Click **Edit** or look for an **Email** field
4. Add the email address
5. Click **Save**

## Important Notes

- **Clerk uses EMAIL addresses for sign-in, not usernames**
- The email field is required for Email/Password authentication
- If Email authentication is disabled in settings, the email field won't appear
- Make sure to enable Email authentication in Settings first

## Troubleshooting

**"I don't see an email field"**
→ Go to Settings → User & Authentication → Enable Email authentication

**"I created a user but can't sign in"**
→ Make sure the user has an email address added to their profile

**"Sign-up is showing instead of sign-in"**
→ Go to Settings → User & Authentication → Disable "Allow users to sign up"

