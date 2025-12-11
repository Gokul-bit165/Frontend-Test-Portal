const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('../database/connection');

async function migrate() {
    console.log('🔄 Checking for assets column in challenges table...');

    try {
        // Check if column exists
        const columns = await query("SHOW COLUMNS FROM challenges LIKE 'assets'");

        if (columns.length === 0) {
            console.log('➕ Column missing. Adding assets JSON column...');
            await query("ALTER TABLE challenges ADD COLUMN assets JSON AFTER level");
            console.log('✅ Column added successfully.');
        } else {
            console.log('✅ Column already exists.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
