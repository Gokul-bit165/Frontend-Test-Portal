# Docker Access Guide

## ⚠️ IMPORTANT: How to Access the Application

### ✅ CORRECT Way (Through Docker)
```
http://localhost          (Frontend via Docker/Nginx)
http://localhost/api      (Backend API via Nginx proxy)
```

### ❌ WRONG Way (Will cause "Route not found" error)
```
http://localhost:5173     (Vite dev server - DON'T USE THIS)
http://localhost:3000     (Old dev server)
```

## Why This Matters

When you access `localhost:5173`, you're using the Vite development server which:
- ❌ Doesn't have the nginx proxy configuration
- ❌ Can't route API calls properly (gets "Route not found")
- ❌ Doesn't use the Docker optimizations
- ❌ Has different timeout settings

When you access `localhost` (port 80), you're using Docker which:
- ✅ Uses nginx reverse proxy
- ✅ Has proper API routing
- ✅ Has 120-second timeouts for Puppeteer
- ✅ Uses optimized Chromium in container
- ✅ Has shared memory (2GB) for Puppeteer

## Quick Start

1. **Start Docker containers**:
   ```powershell
   cd C:\Users\gokul\htmlcss-code-executor\frontend-test-portal
   docker-compose up -d
   ```

2. **Access the application**:
   - Open browser: **http://localhost** (NOT localhost:5173!)

3. **Stop any dev servers**:
   - If you have Vite running on port 5173, close it
   - If you have Node.js on port 5000, close it

## Troubleshooting

### "Route not found" Error
**Cause**: You're accessing `localhost:5173` instead of `localhost`

**Solution**: 
1. Close any terminals running `npm run dev`
2. Access http://localhost (port 80)

### "Port 5000 already in use"
**Cause**: Node.js process still running

**Solution**:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
docker-compose up -d
```

### Evaluation timeout
**Current timeout**: 120 seconds
**If still timing out**:
1. Check backend logs: `docker logs test-portal-backend -f`
2. Look for "📸 Running pixel matching..." - should complete within 120s
3. If not, may need to increase timeouts further

## Container Management

### View logs
```powershell
# Backend logs
docker logs test-portal-backend -f

# Frontend logs  
docker logs test-portal-frontend -f
```

### Restart containers
```powershell
docker-compose restart
```

### Rebuild after code changes
```powershell
docker-compose down
docker-compose build
docker-compose up -d
```

### Check container status
```powershell
docker ps
```

## What's Fixed

### ✅ Puppeteer Optimizations
- Added `--disable-dev-shm-usage` for Docker
- Shared memory: 2GB for Chromium
- Memory limit: 2GB container
- Timeout increased: 10s → 30s for screenshots
- Better error handling

### ✅ Timeout Increases
- Nginx proxy: 60s → 120s
- Axios frontend: 60s → 120s
- Puppeteer launch: 30s timeout
- Page load: 30s timeout (from 10s)

### ✅ Route Configuration
- Nginx properly routes `/api` to backend:5000
- Nginx serves `/screenshots` from backend
- Frontend served from port 80
- No CORS issues

## Performance

- **DOM Comparison**: ~2-5 seconds ✅
- **Screenshot Generation**: ~10-30 seconds ✅
- **Pixel Matching**: ~5-15 seconds ✅
- **Total Evaluation**: ~20-50 seconds ✅

If evaluation exceeds 120 seconds, check backend logs for Puppeteer errors.
