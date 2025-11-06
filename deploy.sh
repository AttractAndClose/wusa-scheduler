#!/bin/bash
# Deployment script for wusa-scheduler

echo "🚀 Setting up GitHub and Vercel deployment..."

# Check if GitHub repo exists
if [ -z "$GITHUB_REPO_URL" ]; then
    echo ""
    echo "📝 Please create a GitHub repository first:"
    echo "   1. Go to https://github.com/new"
    echo "   2. Repository name: wusa-scheduler"
    echo "   3. Description: Intelligent appointment scheduling system"
    echo "   4. Choose Public or Private"
    echo "   5. DO NOT initialize with README, .gitignore, or license"
    echo "   6. Click 'Create repository'"
    echo ""
    read -p "Enter your GitHub username: " GITHUB_USERNAME
    read -p "Enter the repository URL (e.g., https://github.com/USERNAME/wusa-scheduler.git): " GITHUB_REPO_URL
fi

# Add remote and push
echo ""
echo "📤 Pushing to GitHub..."
git remote add origin "$GITHUB_REPO_URL" 2>/dev/null || git remote set-url origin "$GITHUB_REPO_URL"
git branch -M main
git push -u origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "🌐 Next steps for Vercel deployment:"
echo "   1. Go to https://vercel.com/new"
echo "   2. Import your GitHub repository: $GITHUB_REPO_URL"
echo "   3. Framework Preset: Next.js (should auto-detect)"
echo "   4. Root Directory: ./"
echo "   5. Click 'Deploy'"
echo ""
echo "Or use Vercel CLI:"
echo "   npm i -g vercel"
echo "   vercel"
echo "   vercel --prod"

