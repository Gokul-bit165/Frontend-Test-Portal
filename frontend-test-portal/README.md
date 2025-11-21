# 🎯 Frontend Test Portal

A comprehensive web-based platform for evaluating HTML/CSS/JavaScript skills through interactive coding challenges with automated visual and semantic evaluation.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- TiDB Cloud account (or MySQL 8.0+)

### Deployment

1. **Clone the repository**
```bash
git clone <repository-url>
cd frontend-test-portal
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Start the application**
```bash
docker compose up -d
```

4. **Access the application**
- Frontend: http://localhost
- Backend API: http://localhost:5000

## 📋 Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration (TiDB Cloud)
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=test
DB_CA_CERT=your_ssl_certificate

# Application Settings
PORT=5000
USE_JSON=false

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Monaco Editor
- **Backend**: Node.js, Express.js, Puppeteer
- **Database**: TiDB Cloud (MySQL-compatible)
- **Deployment**: Docker, Nginx

### Key Features

#### 1. **Multi-Evaluation System**
- **DOM Comparison**: Semantic HTML structure matching
- **Visual Evaluation**: Pixel-perfect screenshot comparison
- **Content Evaluation**: Text content and formatting validation
- **Strict Mode**: Tag-specific evaluation for precision

#### 2. **Test Management**
- Session-based testing with time tracking
- Randomized question assignment
- Progress persistence across sessions
- Comprehensive admin dashboard

#### 3. **User Authentication**
- Role-based access (Admin/Student)
- JWT token authentication
- Secure password hashing
- Session management

#### 4. **Asset Management**
- Image upload and categorization
- Reference file storage
- Course thumbnail management
- Automatic metadata tracking

## 📁 Project Structure

```
frontend-test-portal/
├── backend/
│   ├── server.js              # Express server entry point
│   ├── database/
│   │   ├── connection.js      # TiDB connection pool
│   │   ├── schema.sql         # Database schema
│   │   └── migrate.js         # Migration scripts
│   ├── routes/
│   │   ├── admin.js           # Admin endpoints
│   │   ├── challenges.js      # Challenge management
│   │   ├── submissions.js     # Submission handling
│   │   ├── users.js           # User authentication
│   │   └── assets.js          # Asset management
│   ├── services/
│   │   ├── evaluator.js       # Main evaluation logic
│   │   ├── semanticEvaluator.js
│   │   ├── pixelMatch.js      # Screenshot comparison
│   │   └── domCompare.js      # DOM structure comparison
│   ├── models/                # Data models
│   ├── assets/                # Static assets storage
│   └── screenshots/           # Generated screenshots
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main React component
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable components
│   │   └── services/
│   │       └── api.js         # API client
│   └── index.html
├── docker-compose.yml         # Docker orchestration
├── Dockerfile.backend         # Backend container
├── Dockerfile.frontend        # Frontend container
├── nginx.conf                 # Nginx reverse proxy
└── .env                       # Environment variables
```

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts and authentication
- **courses** - Course definitions and metadata
- **challenges** - Individual coding challenges
- **submissions** - User submission records with evaluation results
- **test_sessions** - Test session tracking and completion data

### Data Storage
- **Transactional Data**: TiDB Cloud database
- **Static Assets**: Filesystem (`/app/assets/`)
- **Screenshots**: Filesystem (`/app/screenshots/`) with DB references

## 🔧 Admin Features

### Default Admin Account
- Username: `admin`
- Password: `admin123`
- **⚠️ Change immediately after first login**

### Admin Dashboard
- View all user submissions
- Group submissions by test session
- Manage courses and challenges
- Upload and organize assets
- Monitor system usage

## 🎓 User Flow

1. **Registration/Login** - Create account or sign in
2. **Course Selection** - Choose from available courses
3. **Level Selection** - Pick difficulty level
4. **Take Test** - Answer randomized questions
5. **View Results** - See detailed evaluation with screenshots
6. **Track Progress** - Monitor completion across sessions

## 📊 Evaluation Scoring

Each submission is evaluated across multiple dimensions:

- **DOM Score** (25%): HTML structure correctness
- **Visual Score** (25%): Pixel-perfect matching
- **Content Score** (25%): Text and formatting accuracy
- **Tag Score** (25%): Specific element validation

**Passing Criteria**: ≥70% overall score

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- CORS configuration

## 🚢 Production Deployment

### Pre-deployment Checklist
- [ ] Update `.env` with production credentials
- [ ] Change default admin password
- [ ] Configure SSL certificates
- [ ] Set up database backups
- [ ] Configure volume persistence
- [ ] Review security settings
- [ ] Test all endpoints

### Docker Deployment
```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart services
docker compose restart
```

### Health Checks
- Backend health: http://localhost:5000/health
- Frontend: http://localhost

## 📈 Monitoring

### Key Metrics
- User registration count
- Submission success rate
- Average test completion time
- System resource usage

### Logs Location
- Backend: `docker logs test-portal-backend`
- Frontend: `docker logs test-portal-frontend`

## 🛠️ Development

### Local Setup (without Docker)

**Backend:**
```bash
cd backend
npm install
node server.js
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### API Documentation

**Authentication:**
- `POST /api/users/register` - Create new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

**Challenges:**
- `GET /api/challenges` - List all challenges
- `GET /api/challenges/:id` - Get specific challenge
- `POST /api/challenges` - Create challenge (Admin)

**Submissions:**
- `POST /api/submissions` - Submit code for evaluation
- `GET /api/submissions/:userId` - Get user submissions

**Admin:**
- `GET /api/admin/users` - List all users
- `GET /api/admin/submissions/grouped` - Grouped submissions by session

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
docker exec test-portal-backend node -e "const db = require('./database/connection'); db.query('SELECT 1').then(() => console.log('Connected')).catch(e => console.error(e));"
```

### Screenshot Generation Errors
- Ensure Puppeteer is installed correctly
- Check Docker memory allocation (≥2GB recommended)
- Verify `/app/screenshots/` directory permissions

### Frontend Build Errors
```bash
# Clear cache and rebuild
docker compose down
docker compose up -d --build --force-recreate
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Support

For issues and questions:
- Check logs: `docker compose logs`
- Verify database connection
- Review environment variables
- Check Docker resource allocation

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Status**: Production Ready ✅
