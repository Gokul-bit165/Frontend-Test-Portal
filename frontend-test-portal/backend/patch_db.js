
const { pool } = require('./database/connection');

async function patch() {
    try {
        console.log('Attempting to add assets column...');
        await pool.query("ALTER TABLE challenges ADD COLUMN assets JSON");
        console.log('✅ Success: assets column added!');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ Info: assets column already exists.');
        } else {
            // Inspect if maybe it's not mysql or unexpected error
            console.error('❌ Failed:', error);
        }
    } finally {
        process.exit();
    }
}

patch();
