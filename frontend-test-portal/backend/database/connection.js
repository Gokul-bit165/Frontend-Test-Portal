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

// Helper: normalize inline certificates ("\n" -> newline) or load from file
function loadCertificate(certValue) {
  if (!certValue) return undefined;
  const trimmed = certValue.trim();

  if (trimmed.includes("BEGIN CERTIFICATE")) {
    return trimmed.replace(/\\n/g, "\n");
  }

  try {
    return fs.readFileSync(trimmed, "utf8");
  } catch (error) {
    console.warn(
      `⚠️ Unable to read DB_CA_CERT file at ${trimmed}: ${error.message}`
    );
    return undefined;
  }
}

// Database configuration
const sslCertificate = loadCertificate(process.env.DB_CA_CERT);
const sslConfig = sslCertificate
  ? {
      ca: sslCertificate,
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true",
    }
  : undefined;

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database:
    process.env.DB_NAME || process.env.DB_DATABASE || "frontend_test_portal",
  waitForConnections: true,
  connectionLimit: 50, // Increased from 10 for better concurrency (1000+ users)
  queueLimit: 0,
  maxIdle: 10, // Maximum idle connections
  idleTimeout: 60000, // Close idle connections after 60 seconds
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000, // 10 second connection timeout
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
