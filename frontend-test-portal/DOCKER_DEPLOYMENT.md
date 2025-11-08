# 🐳 Docker Deployment Guide

## Quick Start

### Prerequisites
- **Docker Desktop** installed ([Download here](https://www.docker.com/products/docker-desktop))
- **Windows 10/11** with PowerShell

### 1️⃣ One-Command Setup

Open PowerShell in the project directory and run:

```powershell
.\docker-setup.ps1
```

This will:
- ✅ Check Docker installation
- ✅ Build backend and frontend images
- ✅ Start all containers
- ✅ Run health checks
- ✅ Show access URLs

### 2️⃣ Access the Application

Once setup completes:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost/admin

## 📦 What's Included

### Services

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 80 | React + Vite app served by Nginx |
| **Backend** | 5000 | Node.js Express API with Puppeteer |

### Features

✅ **Multi-stage builds** - Optimized image sizes
✅ **Health checks** - Automatic container monitoring
✅ **Volume persistence** - Data and screenshots saved
✅ **Nginx reverse proxy** - API routing handled
✅ **Alpine Linux** - Lightweight containers
✅ **Puppeteer ready** - Chromium pre-installed

## 🛠️ Common Commands

### View Logs
```powershell
# All services
docker-compose logs -f

# Backend only
.\docker-logs.ps1 backend -Follow

# Frontend only
.\docker-logs.ps1 frontend -Follow
```

### Restart Containers
```powershell
docker-compose restart
```

### Stop Containers
```powershell
docker-compose stop
```

### Start Containers
```powershell
docker-compose start
```

### Rebuild After Code Changes
```powershell
.\docker-rebuild.ps1
```

### Remove Everything
```powershell
# Keep data volumes
docker-compose down

# Remove data volumes too
docker-compose down -v
```

## 🔧 Manual Docker Commands

### Build Images
```powershell
# Build all
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Run Containers
```powershell
# Start in background
docker-compose up -d

# Start with logs
docker-compose up

# Start specific service
docker-compose up -d backend
```

### Inspect Containers
```powershell
# List running containers
docker-compose ps

# Get container stats
docker stats

# Execute commands inside container
docker-compose exec backend sh
docker-compose exec frontend sh
```

## 📂 Volume Mounts

Data is persisted in these directories:

| Host Path | Container Path | Purpose |
|-----------|----------------|---------|
| `./backend/screenshots/` | `/app/screenshots` | Screenshot comparisons |
| `./backend/data/` | `/app/data` | Submissions & challenges JSON |

These directories are created automatically and persist across container restarts.

## 🐛 Troubleshooting

### Port Already in Use

**Problem**: Port 80 or 5000 is already in use

**Solution**:
```powershell
# Find process using port 80
Get-Process -Id (Get-NetTCPConnection -LocalPort 80).OwningProcess

# Find process using port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess

# Kill the process
Stop-Process -Id <PID> -Force
```

Or edit `docker-compose.yml` to use different ports:
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 8080 to any free port
  backend:
    ports:
      - "5001:5000"  # Change 5001 to any free port
```

### Backend Not Starting

**Check logs**:
```powershell
docker-compose logs backend
```

**Common issues**:
- Puppeteer failing to launch Chrome → Check logs for Chrome installation errors
- Module not found → Run `docker-compose build --no-cache backend`
- Port conflict → Change port in docker-compose.yml

### Frontend Not Loading

**Check logs**:
```powershell
docker-compose logs frontend
```

**Common issues**:
- 502 Bad Gateway → Backend is down, check backend logs
- Build failed → Run `docker-compose build --no-cache frontend`
- Nginx errors → Check nginx.conf syntax

### Evaluation Timing Out

**Increase timeouts** in `nginx.conf`:
```nginx
location /api {
    proxy_read_timeout 120s;  # Increase from 60s
    proxy_send_timeout 120s;
}
```

Then rebuild:
```powershell
.\docker-rebuild.ps1
```

### Cannot Connect to Docker

**Problem**: "Cannot connect to Docker daemon"

**Solutions**:
1. Start Docker Desktop
2. Wait for Docker to fully start (check tray icon)
3. Restart Docker Desktop if needed
4. Run PowerShell as Administrator

### Puppeteer Errors

**Problem**: "Failed to launch browser"

**Solution**: The Dockerfile already installs Chromium. If errors persist:

1. Check backend logs for specific error
2. Increase container memory in Docker Desktop settings (4GB minimum)
3. Rebuild with no cache:
```powershell
docker-compose build --no-cache backend
```

## 🔒 Security Notes

### Production Deployment

For production, make these changes:

1. **Use HTTPS**:
   - Add SSL certificates to nginx
   - Update nginx.conf with SSL configuration

2. **Environment Variables**:
   - Create `.env` file (don't commit it!)
   - Move sensitive data to environment variables

3. **Database**:
   - Replace JSON files with PostgreSQL/MongoDB
   - Use Docker volume for database data

4. **Admin Password**:
   - Hash admin passwords (use bcrypt)
   - Don't store plain text passwords

5. **Rate Limiting**:
   - Add rate limiting to prevent abuse
   - Use nginx rate limiting or Express middleware

## 📊 Performance

### Container Resource Usage

| Container | CPU | RAM | Disk |
|-----------|-----|-----|------|
| Frontend (Nginx) | <5% | ~10MB | ~50MB |
| Backend (Node + Puppeteer) | 10-50% | ~200MB idle, ~500MB evaluating | ~500MB |

### Optimization Tips

1. **Reduce Image Size**:
   - Use multi-stage builds (already implemented)
   - Remove dev dependencies in production
   - Use Alpine Linux base images

2. **Speed Up Builds**:
   - Use layer caching effectively
   - Don't rebuild if code hasn't changed
   - Use `.dockerignore` properly

3. **Improve Performance**:
   - Increase Docker Desktop memory allocation
   - Use SSD for Docker volumes
   - Close unnecessary applications

## 🚀 Scaling

### Horizontal Scaling

To run multiple backend instances:

```yaml
services:
  backend:
    deploy:
      replicas: 3  # Run 3 backend containers
```

Add a load balancer (nginx or traefik) to distribute requests.

### Vertical Scaling

Increase container resources:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## 📝 Development vs Production

### Development (Current Setup)

```powershell
# Use docker-compose.yml
docker-compose up -d
```

### Production (Recommended)

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - NODE_ENV=production
    restart: always
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    restart: always
```

Run with:
```powershell
docker-compose -f docker-compose.prod.yml up -d
```

## 🔄 Updates & Maintenance

### Update Application
```powershell
# Pull latest code
git pull

# Rebuild containers
.\docker-rebuild.ps1
```

### Backup Data
```powershell
# Backup submissions and screenshots
Copy-Item -Path ".\backend\data\" -Destination ".\backup\data-$(Get-Date -Format 'yyyyMMdd')\" -Recurse
Copy-Item -Path ".\backend\screenshots\" -Destination ".\backup\screenshots-$(Get-Date -Format 'yyyyMMdd')\" -Recurse
```

### Restore Data
```powershell
# Stop containers
docker-compose stop

# Restore files
Copy-Item -Path ".\backup\data-20250108\*" -Destination ".\backend\data\" -Force
Copy-Item -Path ".\backup\screenshots-20250108\*" -Destination ".\backend\screenshots\" -Force

# Restart
docker-compose start
```

## ❓ FAQ

**Q: Do I need to rebuild after every code change?**
A: Yes, Docker creates immutable images. Use `.\docker-rebuild.ps1` for quick rebuilds.

**Q: Can I run this on Linux/Mac?**
A: Yes! The Docker setup works on all platforms. Use `./docker-setup.sh` instead of PowerShell scripts.

**Q: How much disk space do I need?**
A: Approximately 2GB for Docker images + screenshots/data storage.

**Q: Can I use this in production?**
A: Yes, but add HTTPS, proper database, and security hardening first.

**Q: Why is the first build so slow?**
A: Docker downloads Node, Chromium, and dependencies. Subsequent builds are faster with layer caching.

**Q: Can I run without Docker?**
A: Yes! Use the existing `npm run dev` setup. Docker is optional but recommended.

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Puppeteer in Docker](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

**Need help?** Check the troubleshooting section or open an issue on GitHub!
