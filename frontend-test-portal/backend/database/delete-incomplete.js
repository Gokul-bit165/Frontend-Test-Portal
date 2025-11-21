const { query } = require('./connection');

async function deleteIncomplete() {
  try {
    await query("DELETE FROM challenges WHERE id = 'html-css-l1-q1'");
    console.log('✅ Deleted incomplete challenge: html-css-l1-q1');
    
    const result = await query("SELECT COUNT(*) as count FROM challenges");
    console.log(`📊 Total challenges remaining: ${result[0].count}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

deleteIncomplete();
