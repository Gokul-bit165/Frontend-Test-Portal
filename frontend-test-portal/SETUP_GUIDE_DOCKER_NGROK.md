# Quick Setup Guide for Docker + Ngrok Deployment

This guide will help you set up the Frontend Test Portal to run both locally and globally accessible via ngrok.

## Prerequisites

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
2. **Ngrok** - [Download here](https://ngrok.com/download)
3. **Ngrok Account** - Sign up at [ngrok.com](https://ngrok.com) and get your auth token

## Setup Steps

### Option 1: Local Docker Only (No Ngrok)

Run locally on your machine without global access:

```powershell
.\setup-local-docker.ps1
```

Access:
- Frontend: http://localhost
- Backend: http://localhost:5000
- MySQL: localhost:3306

### Option 2: Local + Global Access (With Ngrok)

Run locally AND make it accessible globally via ngrok:

#### Step 1: Start Docker Containers
```powershell
.\setup-local-docker.ps1
```

#### Step 2: Start Ngrok Tunnels

Open **TWO separate PowerShell/Terminal windows**:

**Terminal 1 - Backend Tunnel:**
```powershell
ngrok http 5000
```

**Terminal 2 - Frontend Tunnel:**
```powershell
ngrok http 80
```

#### Step 3: Get Your Ngrok URLs

From each ngrok terminal, copy the HTTPS forwarding URL (e.g., `https://abc-def-ghi.ngrok-free.dev`)

#### Step 4: Update Configuration

Run the ngrok setup script with your URLs:

```powershell
.\setup-ngrok.ps1 -BackendUrl "https://your-backend-url.ngrok-free.dev" -FrontendUrl "https://your-frontend-url.ngrok-free.dev"
```

Or run without parameters and enter URLs when prompted:

```powershell
.\setup-ngrok.ps1
```

## Current Configuration (Based on Screenshots)

You mentioned your ngrok URL is: `https://naturalistic-barrenly-ernestina.ngrok-free.dev`

If you're using the SAME ngrok URL for both frontend and backend, run:

```powershell
.\setup-ngrok.ps1 -BackendUrl "https://naturalistic-barrenly-ernestina.ngrok-free.dev" -FrontendUrl "https://naturalistic-barrenly-ernestina.ngrok-free.dev"
```

## Login Credentials

### Admin Login
- Username: `admin`
- Password: `admin123`

### Student Login
- Username: `student1`
- Password: `123456`

Or use "gokul" as you tried in the screenshot.

## Troubleshooting

### Issue: "Login failed. Please try again."

This happens because of CORS and API URL mismatch. The fixes applied:

1. ✅ Backend now accepts requests from ngrok domains
2. ✅ Frontend configured to send correct API requests
3. ✅ CORS headers properly configured
4. ✅ Ngrok warning headers added

### Issue: Friends Can't Access

Make sure:
1. ✅ Ngrok tunnels are running in separate terminals
2. ✅ You shared the correct ngrok URL
3. ✅ Containers are running: `docker-compose ps`
4. ✅ Firewall allows Docker ports

### Issue: Database Not Saving

The setup now includes:
1. ✅ MySQL container with persistent volume
2. ✅ Auto-initialization with schema and data
3. ✅ Volume mapping for data persistence

### Check Container Status

```powershell
docker-compose ps
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql
```

### Restart Everything

```powershell
docker-compose down
docker-compose up -d
```

### View Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

## Database Access

Connect to MySQL:
```powershell
docker exec -it test-portal-mysql mysql -u root -pgokul frontend_test_portal
```

View users:
```sql
SELECT * FROM users;
```

## Important Notes

1. **Keep ngrok terminals open** - If you close them, the URLs stop working
2. **Free ngrok URLs change** - Each time you restart ngrok, you get a new URL
3. **Paid ngrok** - Get a static domain that doesn't change
4. **Data persists** - MySQL data is saved in a Docker volume

## File Structure

```
frontend-test-portal/
├── docker-compose.yml          # Main Docker configuration with MySQL
├── .env                        # Root environment (auto-generated)
├── .env.ngrok                  # Ngrok configuration template
├── setup-local-docker.ps1      # Local setup script
├── setup-ngrok.ps1             # Ngrok setup script
├── Dockerfile.backend          # Backend container
├── Dockerfile.frontend         # Frontend container (with build args)
├── backend/
│   ├── server.js              # Updated with CORS for ngrok
│   └── data/                  # Persistent data (users, submissions)
└── frontend/
    ├── .env.ngrok             # Frontend ngrok config
    └── src/services/api.js    # Updated with ngrok headers
```

## What Was Fixed

1. **CORS Configuration**: Backend now accepts requests from any ngrok domain
2. **API URL Configuration**: Frontend can be configured via environment variables
3. **Ngrok Headers**: Added `ngrok-skip-browser-warning` header to bypass warning page
4. **Database Persistence**: MySQL container with volume for data persistence
5. **Build Arguments**: Frontend Dockerfile accepts API URL as build argument
6. **Comprehensive Setup**: Scripts for both local and global deployment

## Next Steps

1. Run `.\setup-local-docker.ps1` to start locally
2. Test login at http://localhost
3. Start ngrok tunnels if you need global access
4. Share ngrok URLs with friends
5. They can access and login with the same credentials

## Support

If issues persist:
1. Check `docker-compose logs -f`
2. Verify ngrok tunnels are running
3. Ensure URLs in frontend config match backend ngrok URL
4. Try rebuilding: `docker-compose build --no-cache`
