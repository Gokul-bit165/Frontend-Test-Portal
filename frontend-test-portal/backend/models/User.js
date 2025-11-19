/**
 * User Model
 * Database operations for users table
 */

const { query, queryOne } = require('../database/connection');
const crypto = require('crypto');

function ensurePasswordValue(rawPassword, seed) {
  if (rawPassword !== undefined && rawPassword !== null) {
    return rawPassword;
  }

  const fallbackSeed = seed || `oauth-user-${Date.now()}`;
  return crypto.createHash('sha256').update(String(fallbackSeed)).digest('hex');
}

class UserModel {
  // Get all users
  static async findAll() {
    return await query('SELECT * FROM users ORDER BY created_at DESC');
  }

  // Get user by ID
  static async findById(id) {
    return await queryOne('SELECT * FROM users WHERE id = ?', [id]);
  }

  // Get user by username
  static async findByUsername(username) {
    return await queryOne('SELECT * FROM users WHERE username = ?', [username]);
  }

  // Get user by email
  static async findByEmail(email) {
    return await queryOne('SELECT * FROM users WHERE email = ?', [email]);
  }

  // Create new user
  static async create(userData) {
    const result = await query(
      `INSERT INTO users (id, username, password, email, full_name, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.id,
        userData.username,
        ensurePasswordValue(userData.password, userData.email || userData.username),
        userData.email,
        userData.fullName || userData.full_name,
        userData.role || 'student',
        userData.createdAt || new Date()
      ]
    );
    return await this.findById(userData.id);
  }

  // Update user
  static async update(id, userData) {
    await query(
      `UPDATE users SET
       username = COALESCE(?, username),
       email = COALESCE(?, email),
       full_name = COALESCE(?, full_name),
       role = COALESCE(?, role)
       WHERE id = ?`,
      [
        userData.username ?? null,
        userData.email ?? null,
        (userData.fullName ?? userData.full_name) ?? null,
        userData.role ?? null,
        id
      ]
    );
    return await this.findById(id);
  }

  // Update last login
  static async updateLastLogin(id) {
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [id]
    );
  }

  // Delete user
  static async delete(id) {
    await query('DELETE FROM users WHERE id = ?', [id]);
  }

  // Get user count
  static async count() {
    const result = await queryOne('SELECT COUNT(*) as count FROM users');
    return result.count;
  }
}

module.exports = UserModel;
