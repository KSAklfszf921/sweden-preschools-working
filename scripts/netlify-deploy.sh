#!/bin/bash

# 🚀 Netlify Deploy Script - Trigger från CLI
# Detta triggar en rebuild på Netlify för omedelbar deploy

NETLIFY_SITE_ID="[SITE_ID_KOMMER_SENARE]"
NETLIFY_WEBHOOK="[WEBHOOK_URL_KOMMER_SENARE]"

echo "🚀 Triggering Netlify deployment..."

# Trigger webhook för omedelbar rebuild
curl -X POST "$NETLIFY_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{}'

if [ $? -eq 0 ]; then
    echo "✅ Netlify deployment triggered successfully!"
    echo "🌐 Your site will be updated in 30-60 seconds"
    echo "🔗 Site URL: https://[SITE_NAME].netlify.app"
    
    # Optional: Watch for deployment completion
    echo "⏱️  Monitoring deployment status..."
    sleep 5
    
    # Check deployment status (requires Netlify CLI)
    if command -v netlify >/dev/null 2>&1; then
        netlify status --site="$NETLIFY_SITE_ID"
    fi
else
    echo "❌ Failed to trigger deployment"
    exit 1
fi