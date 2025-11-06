# Vercel Deployment Notes

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

- [ ] Clerk environment variables set in Vercel
- [ ] Build completes successfully (warnings are OK)
- [ ] App loads at Vercel URL
- [ ] Sign-in page works
- [ ] Protected routes redirect to sign-in

