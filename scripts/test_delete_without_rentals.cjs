const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'db.pajxnizsutuaonqpdiut.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '@Rbk171491re',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  // Find 3 themes that are NOT Vingadores
  const res = await client.query("SELECT id, name, code FROM themes WHERE id != 'e0000000-0000-0000-0000-000000000001' LIMIT 3;");
  console.log('Testing deletion of 3 non-rental themes in a transaction:');
  console.table(res.rows);

  const ids = res.rows.map(r => r.id);

  try {
    await client.query('BEGIN;');
    
    // Check if any has media
    const mediaRes = await client.query("SELECT id, entity_id FROM media WHERE entity_type = 'theme' AND entity_id = ANY($1::uuid[]);", [ids]);
    console.log('Associated media rows:', mediaRes.rowCount);

    // Attempt deleting from themes
    const delRes = await client.query('DELETE FROM themes WHERE id = ANY($1::uuid[]);', [ids]);
    console.log('Delete result:', delRes.rowCount);

    await client.query('ROLLBACK;');
    console.log('Transaction rolled back successfully!');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('ERROR ON DELETION:', err.message, err.detail, err.table, err.constraint);
  }

  await client.end();
}

run().catch(console.error);
