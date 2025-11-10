# 🚀 Quick MySQL Setup Guide

## ⚡ Option 1: Docker MySQL (Easiest - 5 minutes)

Since you already have Docker running, use this:

### Step 1: Start MySQL with Docker
```powershell
cd c:\Users\gokul\htmlcss-code-executor\frontend-test-portal

# Start MySQL container
docker-compose -f docker-compose-mysql.yml up -d mysql
```

### Step 2: Wait for MySQL to be ready (30 seconds)
```powershell
# Check if MySQL is ready
docker logs test-portal-mysql
# Wait until you see: "ready for connections"
```

### Step 3: Run Migration
```powershell
# Update backend .env for Docker MySQL
cd backend

# Make sure .env has:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=rootpassword
# DB_NAME=frontend_test_portal

# Run migration
npm run migrate
```

### Step 4: Start Backend
```powershell
# Option A: Start backend directly
npm run dev

# Option B: Start all services with Docker
cd ..
docker-compose -f docker-compose-mysql.yml up -d
```

---

## 🔧 Option 2: Install MySQL Locally (15 minutes)

### Step 1: Download MySQL
- Visit: https://dev.mysql.com/downloads/installer/
- Download: "Windows (x86, 32-bit), MSI Installer"

### Step 2: Install
1. Run the installer
2. Choose "Server only" or "Developer Default"
3. Set root password: `rootpassword` (or your choice)
4. Click "Execute" to install
5. Finish setup

### Step 3: Verify Installation
```powershell
# Restart PowerShell then check:
mysql --version
# Should show: mysql Ver 8.0.x
```

### Step 4: Create Database Manually
```powershell
# Login to MySQL
mysql -u root -p
# Enter your password

# In MySQL shell, run:
SOURCE C:/Users/gokul/htmlcss-code-executor/frontend-test-portal/backend/database/schema.sql
exit
```

### Step 5: Update .env
```powershell
cd c:\Users\gokul\htmlcss-code-executor\frontend-test-portal\backend

# Edit .env file:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_actual_password
# DB_NAME=frontend_test_portal
```

### Step 6: Run Migration
```powershell
npm run migrate
```

### Step 7: Start Server
```powershell
npm run dev
```

---

## ✅ Verify It's Working

You should see in the console:
```
✅ MySQL Database connected successfully
Server running on port 5000
```

Test the connection:
```powershell
cd backend
node -e "require('./database/connection').query('SELECT COUNT(*) as count FROM users').then(r => console.log('Users:', r[0].count))"
```

---

## 🐛 Troubleshooting

### Error: "mysql command not found"
**Solution:** MySQL not installed. Use Docker option or install MySQL.

### Error: "Access denied"
**Solution:** Check password in `.env` file matches MySQL root password.

### Error: "Can't connect to MySQL server"
**Solution:** 
```powershell
# If using local MySQL:
net start MySQL80

# If using Docker:
docker start test-portal-mysql
```

### Error: "Database doesn't exist"
**Solution:**
```powershell
# Create it manually:
mysql -u root -p -e "CREATE DATABASE frontend_test_portal;"
# Then run schema:
mysql -u root -p frontend_test_portal < backend/database/schema.sql
```

---

## 🎯 Recommended: Docker MySQL

**Why Docker is easier:**
✅ No installation needed
✅ Isolated environment
✅ Easy to reset/recreate
✅ Same setup everywhere
✅ No PATH configuration

**Quick start with Docker:**
```powershell
# 1. Start MySQL
docker-compose -f docker-compose-mysql.yml up -d mysql

# 2. Wait 30 seconds

# 3. Run migration
cd backend
npm run migrate

# 4. Done!
```

---

## 📝 Quick Reference

**Docker MySQL:**
```powershell
# Start
docker-compose -f docker-compose-mysql.yml up -d mysql

# Stop
docker-compose -f docker-compose-mysql.yml stop mysql

# Remove
docker-compose -f docker-compose-mysql.yml down -v

# Logs
docker logs test-portal-mysql

# Connect
docker exec -it test-portal-mysql mysql -u root -prootpassword frontend_test_portal
```

**Local MySQL:**
```powershell
# Start service
net start MySQL80

# Stop service
net stop MySQL80

# Connect
mysql -u root -p

# Check status
Get-Service MySQL*
```

---

## 🎉 Next Steps

Once MySQL is running:

1. ✅ Verify connection in server console
2. ✅ Check admin dashboard loads data
3. ✅ Test creating a course/challenge
4. ✅ Submit a test and verify it saves
5. ✅ Check real-time updates work

**Your platform now has enterprise-grade database!** 🚀
