const { query } = require('./connection');

async function test() {
  const result = await query("SELECT id, title, LENGTH(expected_html) as html_len, LENGTH(expected_css) as css_len FROM challenges WHERE id='html-css-l1-q2' LIMIT 1");
  console.log(JSON.stringify(result, null, 2));
  process.exit();
}

test();
