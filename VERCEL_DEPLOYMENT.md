# Vercel Deployment Notes

## Environment Variables

### Required Clerk Environment Variables

For the app to work properly, you need to set these environment variables in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bG92aW5nLWNhcmlib3UtNDIuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_wnerWAXbs5mNc90hM11kMiaRwDpiXF0fvX639FLiWG
```

3. Make sure to set them for **Production**, **Preview**, and **Development** environments
4. Redeploy after adding the variables

### Local Development

The `.env.local` file has been created with the Clerk keys. This file is gitignored and will not be committed.

## Build Warnings (Not Errors)

The deprecation warnings you see are normal and don't prevent deployment:
- `rimraf@3.0.2` - transitive dependency, safe to ignore
- `inflight@1.0.6` - transitive dependency, safe to ignore  
- `eslint@8.57.1` - will be updated in future Next.js versions
- Other warnings are from dev dependencies

These are **warnings**, not errors. Your build should still succeed.

## Actual Build Errors

If you see Clerk-related errors like:
```
Error: @clerk/clerk-react: Missing publishableKey
```

This means:
1. **Environment variables are not set in Vercel**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
   - Redeploy

2. **Pages are trying to prerender with Clerk**
   - Fixed by adding `export const dynamic = 'force-dynamic'` to pages
   - This tells Next.js not to prerender these pages

## Deployment Checklist

- [x] Clerk environment variables set in Vercel (see above)
- [ ] Build completes successfully (warnings are OK)
- [ ] App loads at Vercel URL
- [ ] Sign-in page works
- [ ] Protected routes redirect to sign-in

