
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

console.log('Testing Database Connection...');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Port:', process.env.DB_PORT);
console.log('SSL Configured:', !!process.env.DB_CA_CERT);

function loadCertificate(certValue) {
    if (!certValue) return undefined;
    const trimmed = certValue.trim();
    if (trimmed.includes("BEGIN CERTIFICATE")) {
        return trimmed.replace(/\\n/g, "\n");
    }
    try {
        return fs.readFileSync(trimmed, "utf8");
    } catch (error) {
        return undefined;
    }
}

const sslCertificate = loadCertificate(process.env.DB_CA_CERT);
const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslCertificate ? {
        ca: sslCertificate,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true"
    } : undefined,
    connectTimeout: 5000 // 5s timeout
};

async function test() {
    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Success! Connected to database.');
        await connection.end();
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        if (err.code === 'ETIMEDOUT') {
            console.error('Possible causes: Firewall blocking port 4000, or IP not whitelisted in TiDB Cloud.');
        }
    }
}

test();
