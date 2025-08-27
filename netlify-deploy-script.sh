#!/bin/bash

# 🚀 Automatisk Netlify Deployment Script
echo "🚀 Setting up Netlify deployment..."

# Build projektet lokalt först
echo "📦 Building project..."
npm run build

# Skapa en netlify.toml med korrekta settings
cat > netlify.toml << 'EOF'
# 🚀 Netlify deployment configuration - Sverige Förskolor
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  VITE_SUPABASE_PROJECT_ID = "zfeqsdtddvelapbrwlol"
  VITE_SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZXFzZHRkZHZlbGFwYnJ3bG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njk1NzIsImV4cCI6MjA3MDM0NTU3Mn0.EhgHQSRum7-ZglFq1aAl7vPMM_c0i54gs5eD1fN03UU"
  VITE_SUPABASE_URL = "https://zfeqsdtddvelapbrwlol.supabase.co"

# Redirect all 404s to index.html for SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers for production
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff" 
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache static assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
EOF

echo "✅ Netlify config created with environment variables!"
echo ""
echo "🎯 NEXT STEPS:"
echo "1. Go to https://app.netlify.com/start"
echo "2. Click 'Import an existing project'"
echo "3. Connect GitHub and select: KSAklfszf921/sweden-preschool-spotlight"
echo "4. Settings will auto-populate from netlify.toml"
echo "5. Click 'Deploy site'"
echo ""
echo "⚡ Your site will be live in 30-60 seconds!"
echo "🌐 You'll get a URL like: https://amazing-name-123456.netlify.app"
echo ""
echo "✨ All environment variables are already configured in netlify.toml!"