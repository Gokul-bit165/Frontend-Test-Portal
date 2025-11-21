const { query } = require('./connection');

async function test() {
  const result = await query("SELECT id, title, LENGTH(expected_html) as html_len FROM challenges WHERE id LIKE 'html-css-%' ORDER BY id");
  console.log(JSON.stringify(result, null, 2));
  process.exit();
}

test();
