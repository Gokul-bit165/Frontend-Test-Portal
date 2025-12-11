require('dotenv').config({ path: '../.env' });
const { queryOne } = require('../database/connection');

async function check() {
    try {
        const challenge = await queryOne('SELECT * FROM challenges LIMIT 1');
        console.log(JSON.stringify(challenge, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

check();
