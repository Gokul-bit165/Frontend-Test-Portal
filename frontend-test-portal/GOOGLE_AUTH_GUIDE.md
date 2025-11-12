# Google Auth Integration - Complete Guide

## ✅ Integration Complete!

Your friend successfully added Google OAuth authentication to the workspace branch, and it's now merged into main.

---

## 🔑 What Was Added

### Backend Changes

1. **Google Auth Library**
   - Package: `google-auth-library`
   - JWT support: `jsonwebtoken`
   - Validates Google ID tokens securely

2. **New API Endpoint**: `/api/users/google`
   - Accepts Google ID token
   - Verifies with Google OAuth2Client
   - Creates new users or logs in existing users
   - Returns JWT token for session management

3. **Environment Variables**
   ```
   GOOGLE_CLIENT_ID=563618874909-386bpe7ig2keme4o0gvc6arsp5mh2anu.apps.googleusercontent.com
   JWT_SECRET=frontend-test-portal-secret-key-2025
   ```

4. **User Data Structure** (users.json)
   - `google_id`: Google account identifier
   - `oauth_provider`: 'google' or 'local'
   - `profile_picture`: Google profile photo URL
   - `password`: null for Google OAuth users

### Frontend Changes

1. **Google OAuth Package**
   - Package: `@react-oauth/google`
   - JWT decoder: `jwt-decode`

2. **New Login Page**: `frontend/src/pages/Login.jsx`
   - Traditional username/password form
   - Google Sign-In button
   - Handles both admin and student roles

3. **Main App Wrapper**: `frontend/src/main.jsx`
   ```jsx
   <GoogleOAuthProvider clientId={googleClientId}>
     <App />
   </GoogleOAuthProvider>
   ```

4. **Environment Configuration**
   ```
   VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
   ```

---

## 🗄️ Database Migration (Optional)

If you want to use MySQL instead of JSON files:

```bash
# Connect to MySQL container
docker exec -it test-portal-mysql mysql -uroot -pgokul frontend_test_portal

# Run migration
source /app/database/add-google-auth.sql
```

This adds columns:
- `google_id` (VARCHAR 255, unique)
- `oauth_provider` (VARCHAR 50, default 'local')
- `profile_picture` (TEXT)
- Makes `password` nullable

---

## 📋 How It Works

### Traditional Login Flow
1. User enters username/password
2. Backend hashes password, compares with stored hash
3. Returns JWT token + user data
4. Frontend stores token in localStorage

### Google OAuth Flow
1. User clicks "Sign in with Google"
2. Google popup opens, user signs in
3. Google returns ID token (JWT)
4. Frontend sends token to `/api/users/google`
5. Backend verifies token with Google
6. Backend creates/updates user in database
7. Backend returns app JWT token + user data
8. Frontend stores token in localStorage

---

## 🔐 Security Features

✅ **Token Verification**: Backend validates Google tokens with OAuth2Client  
✅ **JWT Signing**: App tokens signed with SECRET_KEY  
✅ **HTTPS Only**: Production Google OAuth requires HTTPS  
✅ **Audience Check**: Verifies token was issued for your client ID  
✅ **Email Verification**: Requires valid email from Google account

---

## 🧪 Testing Google Auth

### Local Testing
1. Go to http://localhost:5000/login
2. Click "Sign in with Google"
3. Choose your Google account
4. You'll be redirected to dashboard

### Verify User Creation
```bash
# Check users.json
cat backend/data/users.json
```

You should see:
```json
{
  "id": "user-1234567890-abc123",
  "username": "yourname.cs24",
  "password": null,
  "email": "yourname@example.com",
  "full_name": "Your Name",
  "role": "student",
  "picture": "https://lh3.googleusercontent.com/...",
  "created_at": "2025-11-12T...",
  "last_login": "2025-11-12T..."
}
```

---

## 🚀 Deployment Notes

### For Production with Ngrok (HTTPS Required)

Google OAuth requires HTTPS in production. When using ngrok:

1. **Update Authorized Redirect URIs** in Google Cloud Console:
   ```
   https://your-ngrok-url.ngrok-free.app
   https://your-ngrok-url.ngrok-free.app/login
   ```

2. **Update frontend/.env.production**:
   ```
   VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
   ```

3. **Rebuild frontend** with production settings:
   ```bash
   docker-compose build frontend
   docker-compose up -d
   ```

### For Production with Custom Domain

1. **Update Google Cloud Console** with your domain
2. **Update environment variables** in `.env`
3. **Ensure HTTPS** is configured (nginx/Let's Encrypt)

---

## 🛠️ Troubleshooting

### Issue: "Google Sign-In button not showing"
**Solution**: Check browser console for VITE_GOOGLE_CLIENT_ID errors

### Issue: "Invalid token" error
**Solution**: Verify GOOGLE_CLIENT_ID matches in:
- `.env` file
- Google Cloud Console
- Frontend build

### Issue: "User created but can't login"
**Solution**: Check backend logs:
```bash
docker-compose logs backend --tail=50
```

### Issue: "CORS error on Google OAuth"
**Solution**: Add your domain to allowed origins in backend CORS config

---

## 📦 Package Versions

### Backend
```json
{
  "google-auth-library": "^9.x.x",
  "jsonwebtoken": "^9.x.x"
}
```

### Frontend
```json
{
  "@react-oauth/google": "^0.12.x",
  "jwt-decode": "^4.x.x"
}
```

---

## 🔄 Data Migration

To migrate existing users to support Google OAuth:

```sql
UPDATE users SET oauth_provider = 'local' WHERE password IS NOT NULL;
UPDATE users SET oauth_provider = 'google' WHERE password IS NULL;
```

---

## ✅ Current Status

- ✅ Google Auth packages installed
- ✅ Backend `/api/users/google` endpoint working
- ✅ Frontend Google Sign-In button added
- ✅ JWT token management implemented
- ✅ User creation/login flow tested
- ✅ Containers rebuilt and running
- ⏳ Database migration script created (run when switching to MySQL)

---

## 🎯 Next Steps

1. **Test Google Sign-In** on http://localhost:5000/login
2. **Verify user creation** in backend/data/users.json
3. **Test course access** after Google login
4. **(Optional) Run database migration** if switching to MySQL

---

## 📞 Support

If you encounter issues:
1. Check Docker logs: `docker-compose logs backend`
2. Verify environment variables in `.env`
3. Ensure Google OAuth credentials are correct
4. Check browser console for frontend errors

---

**Merge Completed**: 2025-11-12 12:11 IST  
**Branch**: workspace → main  
**Conflicts Resolved**: 4 files (.env, users.json, docker-compose.yml, App.jsx)  
**Status**: ✅ Ready for testing
