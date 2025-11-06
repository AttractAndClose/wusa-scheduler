# Local Development CSS Hot Reload Fix

## Problem
CSS styles disappear on local dev server after changes, but work fine on Vercel.

## Solution

### Option 1: Use the clean dev script (Recommended)
```bash
npm run dev:clean
```
This clears the `.next` cache and starts fresh.

### Option 2: Manual steps
1. Stop the dev server (Ctrl+C)
2. Clear the build cache:
   ```bash
   rm -rf .next
   ```
3. Restart the dev server:
   ```bash
   npm run dev
   ```

### Option 3: Browser-side fixes
If styles still disappear:
1. **Hard refresh** your browser:
   - Mac: `Cmd+Shift+R`
   - Windows: `Ctrl+Shift+R`
2. **Disable cache in DevTools**:
   - Open DevTools (F12)
   - Go to Network tab
   - Check "Disable cache"
   - Keep DevTools open while developing

### Option 4: Use Turbo mode (if available)
If you have Next.js Turbo enabled:
```bash
npm run dev --turbo
```

## Why this happens
Next.js CSS hot module replacement (HMR) can sometimes fail to detect CSS changes, especially with Tailwind CSS. The webpack polling configuration helps, but clearing the cache is the most reliable solution.

## Prevention
- Use `npm run dev:clean` when styles stop updating
- Keep browser DevTools Network tab open with "Disable cache" checked
- Hard refresh (`Cmd+Shift+R`) after making CSS changes

