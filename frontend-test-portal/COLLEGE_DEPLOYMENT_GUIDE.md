# 🎓 College Server Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Security Checklist
- [ ] Change all default passwords
- [ ] Update JWT secret
- [ ] Configure Google OAuth for your domain
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure CORS for your domain
- [ ] Review and remove console.log statements
- [ ] Set NODE_ENV=production
- [ ] Backup MySQL database
- [ ] Test user authentication
- [ ] Test admin panel access

### ✅ Configuration Checklist
- [ ] Update API URLs to server domain
- [ ] Configure database credentials
- [ ] Set up volume persistence
- [ ] Configure server firewall rules
- [ ] Test port accessibility
- [ ] Verify Docker installation
- [ ] Check available resources (RAM: 4GB+, Disk: 20GB+)

---

## 🔒 Critical Security Improvements

### 1. Update Environment Variables

**Create `.env.production`:**
```bash
# Database Configuration
DB_HOST=localhost  # or your MySQL server IP
DB_USER=portal_user  # Create dedicated user
DB_PASSWORD=STRONG_PASSWORD_HERE  # Change this!
DB_NAME=frontend_test_portal

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret - MUST CHANGE!
JWT_SECRET=CHANGE_THIS_TO_RANDOM_64_CHAR_STRING

# Google OAuth - Update for your domain
GOOGLE_CLIENT_ID=YOUR_COLLEGE_GOOGLE_CLIENT_ID

# CORS Origins - Your college domain
ALLOWED_ORIGINS=https://yourdomain.edu,https://www.yourdomain.edu
```

### 2. Database Security

**Create dedicated MySQL user:**
```sql
CREATE USER 'portal_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON frontend_test_portal.* TO 'portal_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Change Default Admin Password

**After first deployment, run:**
```sql
-- Change admin password (this is SHA-256 of "YourNewPassword")
UPDATE users 
SET password = SHA2('YourNewPassword', 256) 
WHERE username = 'admin';
```

---

## 🚀 Deployment Steps

### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Install MySQL (if not using Docker)
sudo apt install mysql-server -y
```

### Step 2: Clone and Configure

```bash
# Clone repository
cd /opt
git clone https://github.com/Gokul-bit165/Frontend-Test-Portal.git
cd Frontend-Test-Portal

# Copy environment file
cp backend/.env.example backend/.env.production

# Edit configuration
nano backend/.env.production
# Update all sensitive values!
```

### Step 3: Update Frontend API URL

**Edit `frontend/.env.production`:**
```bash
VITE_API_URL=https://your-college-domain.edu/api
```

### Step 4: Initialize Database

```bash
# Create database
mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS frontend_test_portal;
USE frontend_test_portal;
SOURCE backend/database/schema.sql;
EOF

# Import initial data (optional)
mysql -u root -p frontend_test_portal < backend/database/import-data.sql
```

### Step 5: Build and Deploy

```bash
# Build Docker images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f backend
```

### Step 6: Configure Nginx (If using separate Nginx)

```nginx
server {
    listen 80;
    server_name your-college-domain.edu;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-college-domain.edu;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

---

## 🔧 Production Optimizations

### 1. Update CORS Configuration

**Edit `backend/server.js`:**
```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
```

### 2. Remove Debug Logging

**Update production server to minimize logs:**
```javascript
// In backend/server.js, wrap console.logs
if (process.env.NODE_ENV !== 'production') {
  console.log('Debug information...');
}
```

### 3. Rate Limiting

**Add to `backend/server.js`:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 4. Set Resource Limits

**Update `docker-compose.yml`:**
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

---

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check backend health
curl http://localhost:5000/health

# Check Docker containers
docker-compose ps

# View logs
docker-compose logs -f backend
```

### Backup Strategy

```bash
# Backup MySQL database (Daily)
mysqldump -u portal_user -p frontend_test_portal > backup_$(date +%Y%m%d).sql

# Backup user data
cp -r backend/data/* /backup/data/

# Backup screenshots
cp -r backend/screenshots/* /backup/screenshots/
```

### Automated Backups

```bash
# Add to crontab
0 2 * * * /opt/Frontend-Test-Portal/backup.sh

# backup.sh
#!/bin/bash
BACKUP_DIR="/backup/portal"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u portal_user -p$DB_PASSWORD frontend_test_portal | gzip > $BACKUP_DIR/db_$DATE.sql.gz
tar -czf $BACKUP_DIR/data_$DATE.tar.gz /opt/Frontend-Test-Portal/backend/data
tar -czf $BACKUP_DIR/screenshots_$DATE.tar.gz /opt/Frontend-Test-Portal/backend/screenshots
find $BACKUP_DIR -mtime +7 -delete  # Keep 7 days
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Port Already in Use
```bash
# Find process using port 5000
sudo lsof -i :5000
# Kill process
sudo kill -9 PID
```

### Issue 2: MySQL Connection Failed
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u portal_user -p -h localhost

# Check user permissions
mysql -u root -p
SHOW GRANTS FOR 'portal_user'@'localhost';
```

### Issue 3: Docker Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Rebuild without cache
docker-compose build --no-cache

# Remove and recreate
docker-compose down -v
docker-compose up -d
```

### Issue 4: Frontend Not Loading
```bash
# Check if frontend is built
ls frontend/dist/

# Rebuild frontend
cd frontend
npm install
npm run build

# Check Nginx/proxy configuration
```

---

## 📈 Performance Tuning

### MySQL Optimization
```sql
-- Add indexes for common queries
ALTER TABLE users ADD INDEX idx_username (username);
ALTER TABLE users ADD INDEX idx_email (email);
ALTER TABLE submissions ADD INDEX idx_user_id (user_id);
ALTER TABLE user_progress ADD INDEX idx_user_course (user_id, course_id);
```

### Node.js Performance
```bash
# Set NODE_OPTIONS for better performance
NODE_OPTIONS="--max-old-space-size=4096"
```

---

## 🎯 Testing Before Go-Live

### 1. Functionality Tests
- [ ] Admin can login
- [ ] Admin can view all users
- [ ] Admin can change user roles
- [ ] Admin can add/edit courses
- [ ] Students can login (Google OAuth)
- [ ] Students can view courses
- [ ] Students can submit code
- [ ] Code evaluation works
- [ ] Screenshots are generated
- [ ] Progress is saved

### 2. Load Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API endpoints
ab -n 1000 -c 10 http://your-domain.edu/api/health
ab -n 100 -c 5 http://your-domain.edu/api/courses
```

### 3. Security Testing
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection (tokens)
- [ ] Rate limiting active
- [ ] HTTPS enforced
- [ ] Authentication working
- [ ] Authorization working

---

## 📞 Support & Troubleshooting

### Log Files
```bash
# Application logs
docker-compose logs -f backend

# MySQL logs
sudo tail -f /var/log/mysql/error.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Quick Commands
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend

# Update and restart
git pull
docker-compose build backend
docker-compose up -d backend

# Full reset (CAUTION: Deletes data)
docker-compose down -v
docker-compose up -d
```

---

## ✅ Post-Deployment Checklist

- [ ] All services are running
- [ ] HTTPS is configured
- [ ] Admin can login
- [ ] Test user can login via Google
- [ ] Code submissions work
- [ ] Backups are scheduled
- [ ] Monitoring is active
- [ ] Documentation is accessible
- [ ] Support contact is available

---

## 🎓 For College IT Team

### Resource Requirements
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 50GB minimum (for screenshots and data)
- **Network**: 100Mbps minimum
- **OS**: Ubuntu 20.04+ or CentOS 8+

### Ports to Open
- **80** (HTTP)
- **443** (HTTPS)
- **5000** (Backend API - can be internal only)
- **3306** (MySQL - internal only)

### Firewall Rules
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

**Ready to deploy? Follow steps sequentially and test at each stage!**
