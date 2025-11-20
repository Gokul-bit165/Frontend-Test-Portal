const db = require('./database/connection');
const fs = require('fs');

(async () => {
  try {
    console.log('Reading SQL file...');
    const sql = fs.readFileSync('/app/add-test-sessions.sql', 'utf8');
    
    console.log('Executing SQL statements...');
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        await db.query(stmt);
      }
    }
    
    console.log('✅ Test sessions table created successfully');
    
    // Verify table exists
    const tables = await db.query("SHOW TABLES LIKE 'test_sessions'");
    console.log('Verified table exists:', tables.length > 0);
    
    // Show table structure
    const desc = await db.query('DESCRIBE test_sessions');
    console.log('\nTable structure:');
    console.log(JSON.stringify(desc, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
