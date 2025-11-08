const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const csv = require('csv-parser');

const usersPath = path.join(__dirname, '../data/users.json');

// Configure multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// Helper functions
function getUsers() {
  if (!fs.existsSync(usersPath)) {
    fs.writeFileSync(usersPath, JSON.stringify([], null, 2));
  }
  const data = fs.readFileSync(usersPath, 'utf8');
  return JSON.parse(data);
}

function saveUsers(users) {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware to verify admin token
function verifyAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Accept any token that's not empty (simplified for now)
  // In production, you'd validate against a token store or JWT
  // For now, we trust that the frontend only sends tokens after successful admin login
  if (token && token.length > 10) {
    next();
  } else {
    return res.status(403).json({ error: 'Invalid admin token' });
  }
}

// User Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = getUsers();
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const hashedPassword = hashPassword(password);
  if (user.password !== hashedPassword) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Generate token
  const token = generateToken();
  
  // Update last login
  user.lastLogin = new Date().toISOString();
  saveUsers(users);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    }
  });
});

// Get all users (Admin only)
router.get('/', verifyAdmin, (req, res) => {
  const users = getUsers();
  
  // Don't send passwords
  const safeUsers = users.map(({ password, ...user }) => user);
  
  res.json(safeUsers);
});

// Get single user
router.get('/:userId', (req, res) => {
  const users = getUsers();
  const user = users.find(u => u.id === req.params.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// Create new user (Admin only)
router.post('/', verifyAdmin, (req, res) => {
  const { username, password, email, fullName, role = 'student' } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = getUsers();
  
  // Check if username exists
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const newUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    username,
    password: hashPassword(password),
    email: email || '',
    fullName: fullName || '',
    role: role || 'student',
    createdAt: new Date().toISOString(),
    lastLogin: null
  };

  users.push(newUser);
  saveUsers(users);

  const { password: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

// Update user (Admin only)
router.put('/:userId', verifyAdmin, (req, res) => {
  const { username, password, email, fullName, role } = req.body;
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === req.params.userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = users[userIndex];

  // Update fields
  if (username && username !== user.username) {
    // Check if new username exists
    if (users.find(u => u.username === username && u.id !== req.params.userId)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    user.username = username;
  }
  
  if (password) {
    user.password = hashPassword(password);
  }
  
  if (email !== undefined) user.email = email;
  if (fullName !== undefined) user.fullName = fullName;
  if (role !== undefined) user.role = role;
  
  user.updatedAt = new Date().toISOString();

  users[userIndex] = user;
  saveUsers(users);

  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// Delete user (Admin only)
router.delete('/:userId', verifyAdmin, (req, res) => {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== req.params.userId);

  if (filteredUsers.length === users.length) {
    return res.status(404).json({ error: 'User not found' });
  }

  saveUsers(filteredUsers);
  res.json({ message: 'User deleted successfully' });
});

// Upload CSV (Admin only)
router.post('/upload-csv', verifyAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const errors = [];
  let added = 0;
  let skipped = 0;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      results.push(row);
    })
    .on('end', () => {
      const users = getUsers();

      results.forEach((row, index) => {
        const lineNum = index + 2; // +2 because CSV header is line 1

        // Validate required fields
        if (!row.username || !row.password) {
          errors.push(`Line ${lineNum}: Missing username or password`);
          skipped++;
          return;
        }

        // Check if username exists
        if (users.find(u => u.username === row.username)) {
          errors.push(`Line ${lineNum}: Username "${row.username}" already exists`);
          skipped++;
          return;
        }

        // Create user
        const newUser = {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          username: row.username,
          password: hashPassword(row.password),
          email: row.email || '',
          fullName: row.fullName || '',
          role: row.role || 'student',
          createdAt: new Date().toISOString(),
          lastLogin: null
        };

        users.push(newUser);
        added++;
      });

      saveUsers(users);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        added,
        skipped,
        total: results.length,
        errors: errors.length > 0 ? errors : undefined
      });
    })
    .on('error', (error) => {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to parse CSV file' });
    });
});

// Download sample CSV
router.get('/sample-csv', (req, res) => {
  const sampleCsv = `username,password,fullName,email,role
student1,password123,John Doe,john@example.com,student
student2,password456,Jane Smith,jane@example.com,student
admin1,adminpass,Admin User,admin@example.com,admin`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=users-sample.csv');
  res.send(sampleCsv);
});

module.exports = router;
