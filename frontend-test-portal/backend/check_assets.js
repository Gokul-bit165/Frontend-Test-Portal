
const { pool } = require('./database/connection');

async function check() {
    try {
        console.log('--- Checking Assets in DB ---');
        const [rows] = await pool.query("SELECT id, title, assets FROM challenges");

        if (rows.length === 0) {
            console.log('No challenges found.');
        } else {
            console.log(`Found ${rows.length} challenges.`);
            rows.forEach(r => {
                console.log(`ID: ${r.id}`);
                console.log(`Title: ${r.title}`);
                console.log(`Type: ${typeof r.assets}`);
                console.log(`Value:`, JSON.stringify(r.assets, null, 2));
                console.log('-------------------');
            });
        }

    } catch (error) {
        console.error('Check Failed:', error);
    } finally {
        process.exit();
    }
}

check();
