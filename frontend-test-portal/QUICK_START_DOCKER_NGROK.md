# 🚀 Quick Start - Docker + Ngrok Setup

## ⚡ Super Quick Setup (Choose One)

### Option 1: Local Only (No Internet Needed)
```powershell
.\complete-setup.ps1 -Local
```
Access at: **http://localhost**

### Option 2: Local + Global (Share with Friends)
```powershell
.\complete-setup.ps1 -Ngrok -BackendUrl "https://your-url.ngrok-free.dev"
```
Then start ngrok tunnels:
```powershell
# Terminal 1
ngrok http 5000

# Terminal 2  
ngrok http 80
```

## 🔐 Login Credentials

| User | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Student | `student1` | `123456` |
| Student | `gokul` | `gokul` |

## ❓ Having Login Issues?

Run the fix script:
```powershell
.\fix-login.ps1
```

## 📋 Your Current Ngrok URL

Based on your screenshot: `https://naturalistic-barrenly-ernestina.ngrok-free.dev`

### Setup Command:
```powershell
.\complete-setup.ps1 -Ngrok -BackendUrl "https://naturalistic-barrenly-ernestina.ngrok-free.dev"
```

### Then Start Ngrok:
```powershell
# Terminal 1 (Backend)
ngrok http 5000

# Terminal 2 (Frontend)
ngrok http 80
```

### Share With Friends:
Give them: `https://naturalistic-barrenly-ernestina.ngrok-free.dev`

## 🛠️ Common Commands

```powershell
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# Restart everything
docker-compose restart

# Stop everything
docker-compose down

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check status
docker-compose ps
```

## 🐛 Troubleshooting

### Problem: "Login failed. Please try again."
**Solution:** Run `.\fix-login.ps1`

### Problem: Friends can't access
**Solution:** 
1. Make sure ngrok tunnels are running
2. Share the HTTPS URL (not HTTP)
3. Check firewall settings

### Problem: Database not saving
**Solution:** 
1. Check if MySQL container is running: `docker-compose ps`
2. View MySQL logs: `docker-compose logs mysql`
3. Restart: `docker-compose restart mysql`

### Problem: Ngrok URL not working
**Solution:**
1. Make sure you're using HTTPS (not HTTP)
2. Try accessing: `https://your-url.ngrok-free.dev/health`
3. If you see ngrok warning page, click "Visit Site"

## 📁 What Got Fixed

✅ **CORS Issues** - Backend now accepts ngrok domains  
✅ **API Configuration** - Frontend points to correct backend URL  
✅ **Database Persistence** - MySQL with persistent storage  
✅ **Ngrok Headers** - Bypass ngrok warning page  
✅ **Login Issues** - Proper authentication handling  

## 🌐 Architecture

```
Your Machine (Docker)
├── MySQL (Port 3306)      - Database
├── Backend (Port 5000)    - API Server
└── Frontend (Port 80)     - Web Interface
        ↓
    Ngrok Tunnels
        ↓
    Internet 🌍
        ↓
    Your Friends
```

## 📖 Detailed Documentation

- **Full Setup Guide:** [SETUP_GUIDE_DOCKER_NGROK.md](./SETUP_GUIDE_DOCKER_NGROK.md)
- **Docker Guide:** [DOCKER_QUICK_START.md](./DOCKER_QUICK_START.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## 💡 Pro Tips

1. **Free ngrok URLs change** - Each time you restart ngrok, you get a new URL
2. **Paid ngrok** - Get a permanent domain that never changes
3. **Keep terminals open** - Don't close ngrok terminal windows
4. **Check logs** - Use `docker-compose logs -f` to see what's happening
5. **Database backups** - Your data is in `backend/data/` folder

## 🆘 Still Having Issues?

1. Run: `.\fix-login.ps1`
2. Check logs: `docker-compose logs -f backend`
3. Restart: `docker-compose restart`
4. Rebuild: `docker-compose build --no-cache && docker-compose up -d`
5. Check ngrok status: Visit your ngrok URL in browser

## 📞 Support Checklist

Before asking for help, please check:
- [ ] Docker is running
- [ ] Containers are running: `docker-compose ps`
- [ ] Ngrok is installed: `ngrok version`
- [ ] Ngrok tunnels are active (check terminals)
- [ ] Using HTTPS ngrok URLs (not HTTP)
- [ ] Tried `.\fix-login.ps1`
- [ ] Checked logs: `docker-compose logs -f`

---

Made with ❤️ for easy deployment
