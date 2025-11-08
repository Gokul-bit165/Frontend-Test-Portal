# User Authentication System

This guide covers the complete user authentication and management system for the Frontend Test Portal.

## 🔐 Features

### 1. **User Login System**
- Secure login page for students
- Token-based authentication
- Password hashing (SHA-256)
- Session management with localStorage

### 2. **Admin User Management**
- Full CRUD operations (Create, Read, Update, Delete)
- User roles: Student and Admin
- Bulk upload via CSV
- Download sample CSV template

### 3. **User Roles**
- **Student**: Access to courses and challenges
- **Admin**: Full system management access

---

## 📋 Default Credentials

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`

### Student Account
- **Username**: `student1`
- **Password**: `123456`

---

## 🚀 Quick Start

### For Students

1. **Navigate to Login Page**
   ```
   http://localhost/login
   ```

2. **Enter Credentials**
   - Username: `student1`
   - Password: `123456`

3. **Access Courses**
   - After login, you'll be redirected to the courses page
   - Your userId is stored in localStorage

### For Admins

1. **Navigate to Admin Login**
   ```
   http://localhost/admin/login
   ```

2. **Enter Admin Credentials**
   - Username: `admin`
   - Password: `admin123`

3. **Manage Users**
   - Go to Admin Dashboard
   - Click "👥 Manage Users"
   - Add, edit, or delete users
   - Upload users via CSV

---

## 👥 Managing Users (Admin)

### Add Single User

1. Click **"+ Add User"** button
2. Fill in the form:
   - **Username**: Required, unique
   - **Password**: Required
   - **Full Name**: Optional
   - **Email**: Optional
   - **Role**: Student or Admin
3. Click **"Add User"**

### Edit User

1. Click **"Edit"** next to any user
2. Update fields:
   - Username cannot be changed
   - Leave password blank to keep current password
   - Update other fields as needed
3. Click **"Update User"**

### Delete User

1. Click **"Delete"** next to any user
2. Confirm deletion
3. User is permanently removed

---

## 📁 Bulk Upload Users via CSV

### Step 1: Download Sample CSV

1. Go to User Management page
2. Click **"⬇️ Download Sample CSV"**
3. You'll get a file like this:

```csv
username,password,fullName,email,role
student1,password123,John Doe,john@example.com,student
student2,password456,Jane Smith,jane@example.com,student
admin1,adminpass,Admin User,admin@example.com,admin
```

### Step 2: Prepare Your CSV File

**Required Columns:**
- `username` - Must be unique
- `password` - Plain text (will be hashed automatically)

**Optional Columns:**
- `fullName` - Student's full name
- `email` - Email address
- `role` - Either "student" or "admin" (defaults to "student")

**Example CSV:**
```csv
username,password,fullName,email,role
alice,pass123,Alice Johnson,alice@school.com,student
bob,pass456,Bob Williams,bob@school.com,student
charlie,pass789,Charlie Brown,charlie@school.com,student
teacher1,teach123,Ms. Teacher,teacher@school.com,admin
```

### Step 3: Upload CSV

1. Click **"📁 Upload CSV"** button
2. Select your CSV file
3. Click **"Upload CSV"**
4. Review the results:
   - **Added**: Number of users successfully created
   - **Skipped**: Users that already exist
   - **Errors**: Any validation issues

### Upload Results Example

```json
{
  "added": 15,
  "skipped": 2,
  "total": 17,
  "errors": [
    "Line 5: Username 'alice' already exists",
    "Line 12: Missing username or password"
  ]
}
```

---

## 🔧 API Endpoints

### Authentication

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "student1",
  "password": "123456"
}

Response:
{
  "token": "abc123...",
  "user": {
    "id": "user-123",
    "username": "student1",
    "email": "student1@example.com",
    "fullName": "Demo Student",
    "role": "student"
  }
}
```

### User Management (Admin Only)

**Get All Users**
```http
GET /api/users
Authorization: Bearer admin-secret-token

Response:
[
  {
    "id": "user-123",
    "username": "student1",
    "email": "student1@example.com",
    "fullName": "Demo Student",
    "role": "student",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-15T10:30:00.000Z"
  }
]
```

**Create User**
```http
POST /api/users
Authorization: Bearer admin-secret-token
Content-Type: application/json

{
  "username": "newstudent",
  "password": "password123",
  "fullName": "New Student",
  "email": "new@example.com",
  "role": "student"
}

Response:
{
  "id": "user-456",
  "username": "newstudent",
  "email": "new@example.com",
  "fullName": "New Student",
  "role": "student",
  "createdAt": "2024-01-20T12:00:00.000Z"
}
```

**Update User**
```http
PUT /api/users/:userId
Authorization: Bearer admin-secret-token
Content-Type: application/json

{
  "password": "newpassword",
  "fullName": "Updated Name",
  "email": "updated@example.com"
}
```

**Delete User**
```http
DELETE /api/users/:userId
Authorization: Bearer admin-secret-token

Response:
{
  "message": "User deleted successfully"
}
```

**Upload CSV**
```http
POST /api/users/upload-csv
Authorization: Bearer admin-secret-token
Content-Type: multipart/form-data

Form Data:
- file: users.csv

Response:
{
  "added": 10,
  "skipped": 2,
  "total": 12,
  "errors": ["Line 5: Username already exists"]
}
```

**Download Sample CSV**
```http
GET /api/users/sample-csv

Response: CSV file download
```

---

## 🔒 Security Features

### Password Hashing
- All passwords are hashed using SHA-256
- Passwords are never stored in plain text
- Hashing happens automatically on user creation

### Token-Based Authentication
- Each login generates a unique token
- Tokens stored in localStorage
- Admin operations require valid admin token

### Role-Based Access Control
- Students can only access course content
- Admins can manage users, courses, and questions
- Protected routes check authentication status

---

## 📊 User Data Structure

```json
{
  "id": "user-1234567890-abc123",
  "username": "student1",
  "password": "hashed_password_sha256",
  "email": "student1@example.com",
  "fullName": "John Doe",
  "role": "student",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLogin": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T14:00:00.000Z"
}
```

---

## 🎓 Integration with Course System

### How It Works

1. **Student Logs In**
   - Username and password validated
   - userId stored in localStorage
   - Token generated for session

2. **Accessing Courses**
   - userId automatically attached to all requests
   - Progress tracked per user
   - Random question assignments per user

3. **Progress Tracking**
   - Each user has unique progress
   - Assignments stored by userId
   - Completion tracked individually

### Example Flow

```javascript
// After login
localStorage.setItem('userId', 'user-123');
localStorage.setItem('username', 'student1');
localStorage.setItem('userToken', 'abc123...');

// When accessing courses
const userId = localStorage.getItem('userId');
const questions = await getLevelQuestions(courseId, level, userId);

// When completing questions
await completeQuestion(userId, {
  questionId: 'q1',
  courseId: 'course-html-css',
  level: 1,
  score: 95
});
```

---

## 🛠️ Troubleshooting

### Login Issues

**Problem**: "Invalid username or password"
- **Solution**: Check credentials are correct
- **Note**: Passwords are case-sensitive

**Problem**: Can't access courses after login
- **Solution**: Check localStorage has userId set
- **Command**: Open browser console and run `localStorage.getItem('userId')`

### CSV Upload Issues

**Problem**: "Username already exists"
- **Solution**: Users in CSV must have unique usernames
- **Fix**: Remove duplicate entries from CSV

**Problem**: "Missing username or password"
- **Solution**: Ensure CSV has username and password columns
- **Fix**: Check CSV format matches sample

**Problem**: Upload shows 0 added
- **Solution**: Check CSV format is correct
- **Fix**: Verify no BOM (Byte Order Mark) in CSV file

---

## 📝 CSV Format Tips

### Correct Format
```csv
username,password,fullName,email,role
alice,pass123,Alice J,alice@test.com,student
```

### Common Mistakes

❌ **Missing Header**
```csv
alice,pass123,Alice J,alice@test.com,student
bob,pass456,Bob W,bob@test.com,student
```

❌ **Wrong Column Order**
```csv
password,username,fullName,email,role
pass123,alice,Alice J,alice@test.com,student
```

❌ **Extra Spaces**
```csv
username, password, fullName, email, role
alice, pass123, Alice J, alice@test.com, student
```

✅ **Correct Format**
```csv
username,password,fullName,email,role
alice,pass123,Alice J,alice@test.com,student
bob,pass456,Bob W,bob@test.com,student
```

---

## 🔄 Workflow Examples

### Adding 50 Students

1. **Prepare CSV**
   ```csv
   username,password,fullName,email,role
   student01,temp123,Student One,s01@school.com,student
   student02,temp123,Student Two,s02@school.com,student
   ...
   student50,temp123,Student Fifty,s50@school.com,student
   ```

2. **Upload via Admin Panel**
   - Login as admin
   - Go to User Management
   - Upload CSV
   - Verify all 50 added

3. **Share Credentials**
   - Give each student their username
   - Temporary password: `temp123`
   - Students can login at `/login`

### Resetting User Password

1. **Admin edits user**
2. **Enters new password**
3. **Leaves other fields unchanged**
4. **Clicks Update**
5. **User can login with new password**

---

## 📈 Next Steps

### Enhancements You Can Add

1. **Email Verification**
   - Send verification emails on signup
   - Require email confirmation

2. **Password Reset**
   - "Forgot Password" link
   - Email-based password reset

3. **Profile Pages**
   - Let users update their own profiles
   - Upload profile pictures

4. **Activity Logs**
   - Track user login history
   - Monitor course progress

5. **Bulk Operations**
   - Export users to CSV
   - Bulk delete users
   - Bulk role changes

---

## 🎯 Summary

✅ **Complete user authentication system**
✅ **Admin user management interface**
✅ **Bulk CSV upload with validation**
✅ **Secure password hashing**
✅ **Token-based sessions**
✅ **Role-based access control**
✅ **Integration with course system**

**System Status**: ✅ Ready for Production

Access:
- **Student Login**: http://localhost/login
- **Admin Login**: http://localhost/admin/login
- **User Management**: http://localhost/admin/users

Default Credentials:
- Admin: `admin` / `admin123`
- Student: `student1` / `123456`
