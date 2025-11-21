const { query } = require('./connection');

async function check() {
  const result = await query("SELECT id, title, SUBSTRING(expected_html, 1, 100) as html_preview, LENGTH(expected_html) as html_len FROM challenges WHERE id='fullstack-l1-q1'");
  console.log(JSON.stringify(result, null, 2));
  process.exit();
}

check();
