#!/bin/bash
# Bootstrap deployment script - Run this ONCE on server to fix initial state

set -e

echo "🔧 Bootstrap Deployment"
echo "======================="

cd /root/BE_BHair_SQLite

echo "📥 Pulling latest code from production..."
git fetch origin production
git reset --hard origin/production

echo "📦 Installing dependencies..."
npm install --production

echo "🔄 Restarting PM2..."
pm2 restart BE_BHair_SQLite

echo "✅ Bootstrap complete! Future deploys will be automatic."
echo ""
echo "📋 Check logs:"
echo "   pm2 logs BE_BHair_SQLite"
