// /**
//  * MySQL Database Configuration
//  * Connection pool for database operations
//  * Falls back to JSON files if MySQL is not available
//  */

// const mysql = require('mysql2/promise');

// // Check if we should use JSON files instead of MySQL
// const USE_JSON = process.env.USE_JSON === 'true' || !process.env.DB_HOST;

// // Database configuration
// const dbConfig = {
//   host: process.env.DB_HOST || 'localhost',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'frontend_test_portal',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   enableKeepAlive: true,
//   keepAliveInitialDelay: 0
// };

// // Create connection pool
// const pool = mysql.createPool(dbConfig);

// let isConnected = false;

// // Test connection
// pool.getConnection()
//   .then(connection => {
//     console.log('✅ MySQL Database connected successfully');
//     isConnected = true;
//     connection.release();
//   })
//   .catch(err => {
//     console.error('❌ MySQL connection error:', err.message);
//     console.log('📁 Using JSON file storage as fallback');
//     isConnected = false;
//   });

// // Helper function to execute queries
// async function query(sql, params) {
//   try {
//     const [rows] = await pool.execute(sql, params);
//     return rows;
//   } catch (error) {
//     console.error('Database query error:', error);
//     throw error;
//   }
// }

// // Helper function to get a single row
// async function queryOne(sql, params) {
//   const rows = await query(sql, params);
//   return rows[0] || null;
// }

// // Transaction helper
// async function transaction(callback) {
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();
//     const result = await callback(connection);
//     await connection.commit();
//     return result;
//   } catch (error) {
//     await connection.rollback();
//     throw error;
//   } finally {
//     connection.release();
//   }
// }

// module.exports = {
//   pool,
//   query,
//   queryOne,
//   transaction,
//   isConnected: () => isConnected,
//   USE_JSON
// };
/**
 * MySQL Database Configuration
 * Connection pool for database operations
 * Falls back to JSON files if MySQL is not available
 */

const fs = require("fs");
const mysql = require("mysql2/promise");

// Check if we should use JSON files instead of MySQL
const USE_JSON = process.env.USE_JSON === "true" || !process.env.DB_HOST;

// Database configuration
// Support both file path and direct certificate content
const sslConfig = process.env.DB_CA_CERT
  ? {
      ca: process.env.DB_CA_CERT.includes("BEGIN CERTIFICATE")
        ? process.env.DB_CA_CERT // Direct certificate content
        : fs.readFileSync(process.env.DB_CA_CERT), // File path
      rejectUnauthorized: false, // Accept self-signed certificates
    }
  : undefined;

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ...(sslConfig ? { ssl: sslConfig } : {}),
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

let isConnected = false;

// Test connection
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ MySQL Database connected successfully");
    isConnected = true;
    connection.release();
  })
  .catch((err) => {
    console.error("❌ MySQL connection error:", err.message);
    console.log("📁 Using JSON file storage as fallback");
    isConnected = false;
  });

// Helper function to execute queries
async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Helper function to get a single row
async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

// Transaction helper
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  queryOne,
  transaction,
  isConnected: () => isConnected,
  USE_JSON,
};
