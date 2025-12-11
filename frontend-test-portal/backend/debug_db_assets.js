
require('dotenv').config();
const { pool } = require('./database/connection');

async function check() {
    try {
        console.log('--- Checking Table Schema ---');
        const [columns] = await pool.query("DESCRIBE challenges");
        const assetsCol = columns.find(c => c.Field === 'assets');
        console.log('Assets Column:', assetsCol);

        console.log('\n--- Checking Data for html-css-l1-q2 ---');
        // Try precise ID or similar
        const [rows] = await pool.query("SELECT id, assets FROM challenges WHERE id LIKE '%l1-q2%' OR id = 'html-css-l1-q2' LIMIT 5");

        if (rows.length === 0) {
            console.log('No matching question found.');
        } else {
            rows.forEach(r => {
                console.log(`ID: ${r.id}`);
                console.log(`Assets Type: ${typeof r.assets}`);
                console.log(`Assets Value:`, JSON.stringify(r.assets, null, 2));
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        pool.end();
    }
}

check();
