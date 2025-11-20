const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const csv = require("csv-parser");
const UserModel = require("../models/User");
const { query } = require("../database/connection");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Path to JSON users file
const usersPath = path.join(__dirname, "../data/users.json");

// Helper to load JSON files
const loadJSON = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return [];
  }
};

// Helper to save JSON files
const saveJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error.message);
    return false;
  }
};

// Configure multer for CSV uploads
const upload = multer({ dest: "uploads/" });

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Google OAuth login
router.post("/google", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Google token is required" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const name =
      payload?.name ||
      `${payload?.given_name || ""} ${payload?.family_name || ""}`.trim();
    const picture = payload?.picture;

    if (!email) {
      return res
        .status(400)
        .json({ error: "Google account email is required" });
    }

    const username = email.split("@")[0];

    let user;
    try {
      user = await UserModel.findByUsername(username);
    } catch (dbLookupError) {
      console.warn(
        "DB lookup error, fallback to JSON file:",
        dbLookupError.message
      );
      const users = loadJSON(usersPath);
      // Find the MOST RECENT entry for this username (latest created_at)
      const userMatches = users.filter((u) => u.username === username);
      if (userMatches.length > 0) {
        user = userMatches.reduce((latest, current) => {
          const latestTime = new Date(latest.created_at || 0).getTime();
          const currentTime = new Date(current.created_at || 0).getTime();
          return currentTime > latestTime ? current : latest;
        });
      }
    }

    if (!user) {
      const newUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username,
        password: null,
        email,
        full_name: name || username,
        role: "student",
        created_at: new Date(),
        last_login: new Date(),
        picture,
      };

      try {
        const userId = await UserModel.create(newUser);
        user = await UserModel.findById(userId);
      } catch (dbCreateError) {
        console.warn(
          "DB create error, persisting to JSON file:",
          dbCreateError.message
        );
        const users = loadJSON(usersPath);
        users.push({
          ...newUser,
          created_at:
            newUser.created_at instanceof Date
              ? newUser.created_at.toISOString()
              : newUser.created_at,
          last_login:
            newUser.last_login instanceof Date
              ? newUser.last_login.toISOString()
              : newUser.last_login,
        });
        saveJSON(usersPath, users);
        user = newUser;
      }
    } else {
      try {
        await UserModel.update(user.id, { last_login: new Date() });
        user = await UserModel.findById(user.id);
      } catch (dbUpdateError) {
        console.log(
          "DB update failed, updating JSON fallback:",
          dbUpdateError.message
        );
        const users = loadJSON(usersPath);
        const userIndex = users.findIndex((u) => u.id === user.id);
        if (userIndex !== -1) {
          users[userIndex].last_login = new Date().toISOString();
          saveJSON(usersPath, users);
        }
      }
    }

    const jwtSecret = process.env.JWT_SECRET;
    const payloadForToken = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const appToken = jwtSecret
      ? jwt.sign(payloadForToken, jwtSecret, { expiresIn: "7d" })
      : generateToken();

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || user.full_name || name,
        role: user.role,
        picture: user.picture || picture,
      },
      token: appToken,
    });
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    res.status(401).json({ error: "Invalid Google token" });
  }
});

// Middleware to verify admin token
function verifyAdmin(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Accept any token that's not empty (simplified for now)
  // In production, you'd validate against a token store or JWT
  // For now, we trust that the frontend only sends tokens after successful admin login
  if (token && token.length > 10) {
    next();
  } else {
    return res.status(403).json({ error: "Invalid admin token" });
  }
}

// User Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    let user;

    // Try database first
    try {
      user = await UserModel.findByUsername(username);
    } catch (dbError) {
      console.log(
        "Database error, using JSON file for login:",
        dbError.message
      );
      // Fallback to JSON file
      const users = loadJSON(usersPath);
      user = users.find((u) => u.username === username);
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate token
    const token = generateToken();

    // Update last login (try database, fallback to JSON)
    try {
      await UserModel.update(user.id, { last_login: new Date() });
    } catch (dbError) {
      console.log("Database error, updating JSON file:", dbError.message);
      const users = loadJSON(usersPath);
      const userIndex = users.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex].lastLogin = new Date().toISOString();
        saveJSON(usersPath, users);
      }
    }

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get all users (Admin only)
router.get("/", verifyAdmin, async (req, res) => {
  try {
    let users;

    // Try database first
    try {
      users = await UserModel.findAll();
    } catch (dbError) {
      console.log(
        "Database error, using JSON file for users:",
        dbError.message
      );
      // Fallback to JSON file
      users = loadJSON(usersPath);
    }

    // Don't send passwords and convert snake_case to camelCase for frontend
    const safeUsers = users.map(({ password, ...user }) => ({
      ...user,
      fullName: user.fullName || user.full_name,
      createdAt: user.createdAt || user.created_at,
      lastLogin: user.lastLogin || user.last_login,
    }));

    res.json(safeUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user progress data (Admin only)
router.get("/progress", verifyAdmin, async (req, res) => {
  try {
    const progressData = await query(`
      SELECT 
        up.user_id as userId,
        u.username,
        up.course_id as courseId,
        c.title as courseTitle,
        up.current_level as currentLevel,
        up.completed_levels as completedLevels,
        up.total_points as totalPoints,
        up.last_updated as lastUpdated
      FROM user_progress up
      JOIN users u ON up.user_id = u.id
      JOIN courses c ON up.course_id = c.id
      ORDER BY u.username, c.title
    `);

    // Parse JSON fields
    const formattedData = progressData.map((row) => ({
      ...row,
      completedLevels: JSON.parse(row.completedLevels || "[]"),
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ error: "Failed to load progress data" });
  }
});

// Get single user
router.get("/:userId", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...safeUser } = user;
    // Convert snake_case to camelCase
    safeUser.fullName = safeUser.full_name;
    safeUser.createdAt = safeUser.created_at;
    safeUser.lastLogin = safeUser.last_login;
    delete safeUser.full_name;
    delete safeUser.created_at;
    delete safeUser.last_login;

    res.json(safeUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Create new user (Admin only)
router.post("/", verifyAdmin, async (req, res) => {
  const { username, password, email, fullName, role = "student" } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    // Check if username exists
    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      password: hashPassword(password),
      email: email || "",
      full_name: fullName || "",
      role: role || "student",
      created_at: new Date(),
      last_login: null,
    };

    const userId = await UserModel.create(newUser);
    const createdUser = await UserModel.findById(userId);

    const {
      password: _,
      full_name,
      created_at,
      last_login,
      ...safeUser
    } = createdUser;
    safeUser.fullName = full_name;
    safeUser.createdAt = created_at;
    safeUser.lastLogin = last_login;

    res.status(201).json(safeUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update user (Admin only)
router.put("/:userId", verifyAdmin, async (req, res) => {
  const { username, password, email, fullName, role } = req.body;

  try {
    const user = await UserModel.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates = {};

    // Update fields
    if (username && username !== user.username) {
      // Check if new username exists
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser && existingUser.id !== req.params.userId) {
        return res.status(400).json({ error: "Username already exists" });
      }
      updates.username = username;
    }

    if (password) {
      updates.password = hashPassword(password);
    }

    if (email !== undefined) updates.email = email;
    if (fullName !== undefined) updates.full_name = fullName;
    if (role !== undefined) updates.role = role;

    await UserModel.update(req.params.userId, updates);
    const updatedUser = await UserModel.findById(req.params.userId);

    const {
      password: _,
      full_name,
      created_at,
      last_login,
      ...safeUser
    } = updatedUser;
    safeUser.fullName = full_name;
    safeUser.createdAt = created_at;
    safeUser.lastLogin = last_login;

    res.json(safeUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user (Admin only)
router.delete("/:userId", verifyAdmin, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await UserModel.delete(req.params.userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Upload CSV (Admin only)
router.post(
  "/upload-csv",
  verifyAdmin,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const results = [];
    const errors = [];
    let added = 0;
    let skipped = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", async () => {
        try {
          for (let index = 0; index < results.length; index++) {
            const row = results[index];
            const lineNum = index + 2; // +2 because CSV header is line 1

            // Validate required fields
            if (!row.username || !row.password) {
              errors.push(`Line ${lineNum}: Missing username or password`);
              skipped++;
              continue;
            }

            // Check if username exists
            const existingUser = await UserModel.findByUsername(row.username);
            if (existingUser) {
              errors.push(
                `Line ${lineNum}: Username "${row.username}" already exists`
              );
              skipped++;
              continue;
            }

            // Create user
            const newUser = {
              id: `user-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              username: row.username,
              password: hashPassword(row.password),
              email: row.email || "",
              full_name: row.fullName || "",
              role: row.role || "student",
              created_at: new Date(),
              last_login: null,
            };

            await UserModel.create(newUser);
            added++;
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            added,
            skipped,
            total: results.length,
            errors: errors.length > 0 ? errors : undefined,
          });
        } catch (error) {
          // Clean up uploaded file
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          console.error("Error processing CSV:", error);
          res.status(500).json({ error: "Failed to process CSV file" });
        }
      })
      .on("error", (error) => {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: "Failed to parse CSV file" });
      });
  }
);

// Download sample CSV
router.get("/sample-csv", (req, res) => {
  const sampleCsv = `username,password,fullName,email,role
student1,password123,John Doe,john@example.com,student
student2,password456,Jane Smith,jane@example.com,student
admin1,adminpass,Admin User,admin@example.com,admin`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=users-sample.csv");
  res.send(sampleCsv);
});

// Mark level as complete
router.post("/complete-level", (req, res) => {
  try {
    const { userId, courseId, level } = req.body;

    if (!userId || !courseId || !level) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Read user progress
    const progressPath = path.join(__dirname, "../data/user-progress.json");
    let progressData = [];
    try {
      const data = fs.readFileSync(progressPath, "utf8");
      progressData = JSON.parse(data);
    } catch (error) {
      progressData = [];
    }

    // Find or create user progress
    let userProgress = progressData.find((p) => p.userId === userId);
    if (!userProgress) {
      userProgress = {
        userId,
        courses: [],
      };
      progressData.push(userProgress);
    }

    // Find or create course progress
    let courseProgress = userProgress.courses.find(
      (c) => c.courseId === courseId
    );
    if (!courseProgress) {
      courseProgress = {
        courseId,
        completedLevels: [],
        lastAccessedLevel: level,
      };
      userProgress.courses.push(courseProgress);
    }

    // Add completed level if not already present
    if (!courseProgress.completedLevels.includes(level)) {
      courseProgress.completedLevels.push(level);
      courseProgress.completedLevels.sort((a, b) => a - b);
    }

    // Update last accessed level
    courseProgress.lastAccessedLevel = Math.max(
      courseProgress.lastAccessedLevel || 0,
      level
    );

    // Save progress
    fs.writeFileSync(progressPath, JSON.stringify(progressData, null, 2));

    // Also update user assignments
    const assignmentsPath = path.join(
      __dirname,
      "../data/user-assignments.json"
    );
    let assignments = [];
    try {
      const data = fs.readFileSync(assignmentsPath, "utf8");
      assignments = JSON.parse(data);
    } catch (error) {
      assignments = [];
    }

    const assignmentKey = `${userId}-${courseId}-${level}`;
    const assignment = assignments.find((a) => a.key === assignmentKey);
    if (assignment) {
      assignment.isLevelComplete = true;
      assignment.completedAt = new Date().toISOString();
      fs.writeFileSync(assignmentsPath, JSON.stringify(assignments, null, 2));
    }

    res.json({
      success: true,
      message: "Level marked as complete",
      nextLevel: level + 1,
    });
  } catch (error) {
    console.error("Error completing level:", error);
    res.status(500).json({ error: "Failed to mark level as complete" });
  }
});

module.exports = router;
