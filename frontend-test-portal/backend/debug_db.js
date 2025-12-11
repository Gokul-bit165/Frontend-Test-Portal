
const { pool } = require('./database/connection');

async function debug() {
    try {
        console.log('--- DB Debug ---');
        // 1. Get raw row
        const [rows] = await pool.query("SELECT id, assets FROM challenges LIMIT 1");
        if (rows.length === 0) {
            console.log('No challenges found.');
            return;
        }
        const id = rows[0].id;
        console.log(`Checking Question ID: ${id}`);
        console.log('Current Assets RAW:', rows[0].assets);
        console.log('Type of Assets:', typeof rows[0].assets);

        // 2. Attempt Update
        const testAssets = JSON.stringify({ images: [{ name: 'test.png', path: '/test.png' }], reference: 'test' });
        console.log('Updating assets to:', testAssets);
        const [result] = await pool.query("UPDATE challenges SET assets = ? WHERE id = ?", [testAssets, id]);
        console.log('Update Result:', result);

        // 3. Verify Update
        const [check] = await pool.query("SELECT assets FROM challenges WHERE id = ?", [id]);
        console.log('New Assets RAW:', check[0].assets);

    } catch (error) {
        console.error('Debug Failed:', error);
    } finally {
        process.exit();
    }
}

debug();
