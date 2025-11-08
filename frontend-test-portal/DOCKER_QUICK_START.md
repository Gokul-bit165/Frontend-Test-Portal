# 🎯 Quick Reference - Docker Commands

## 🚀 First Time Setup
```powershell
.\docker-setup.ps1
```
Then open: http://localhost

## 🔄 After Code Changes
```powershell
.\docker-rebuild.ps1
```

## 📋 View Logs
```powershell
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only  
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100
```

## 🛠️ Container Management
```powershell
# Status
docker-compose ps

# Stop
docker-compose stop

# Start
docker-compose start

# Restart
docker-compose restart

# Remove (keep data)
docker-compose down

# Remove (delete data)
docker-compose down -v
```

## 🔍 Debugging
```powershell
# Enter backend container
docker-compose exec backend sh

# Enter frontend container
docker-compose exec frontend sh

# Check container stats
docker stats

# Inspect container
docker inspect test-portal-backend
docker inspect test-portal-frontend
```

## 🏥 Health Checks
```powershell
# Backend health
curl http://localhost:5000/health

# Frontend (should return HTML)
curl http://localhost

# API endpoint
curl http://localhost:5000/api/challenges
```

## 🐛 Troubleshooting

### Port Conflicts
```powershell
# Find what's using port 80
Get-NetTCPConnection -LocalPort 80

# Find what's using port 5000  
Get-NetTCPConnection -LocalPort 5000

# Kill process
Stop-Process -Id <PID> -Force
```

### Rebuild from Scratch
```powershell
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Clear Docker Cache
```powershell
docker system prune -a
```

## 📦 Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend | http://localhost:5000 |
| Admin Panel | http://localhost/admin |
| API | http://localhost:5000/api |
| Health Check | http://localhost:5000/health |

## 💾 Data Locations

| Data | Path |
|------|------|
| Submissions | `./backend/data/submissions.json` |
| Challenges | `./backend/data/challenges.json` |
| Screenshots | `./backend/screenshots/` |

## 🎨 New Features

### Expected Screenshot Viewer
- ✅ Toggle button on challenge page
- ✅ Shows what the expected result looks like
- ✅ Helps candidates understand requirements
- ✅ Side-by-side comparison with live preview

### Docker Benefits
- ✅ No manual backend/frontend setup
- ✅ Consistent environment across machines
- ✅ Puppeteer pre-configured
- ✅ Nginx handles routing
- ✅ Easy deployment
- ✅ Persistent data storage

---

**Pro Tip**: Keep Docker Desktop running in the background!
