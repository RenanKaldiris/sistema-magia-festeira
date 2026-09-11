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

  // Let's get 3 themes
  const res = await client.query('SELECT id, name, code FROM themes LIMIT 3;');
  console.log('Testing deletion of 3 themes in a transaction with ROLLBACK:');
  console.table(res.rows);

  const ids = res.rows.map(r => r.id);

  try {
    await client.query('BEGIN;');
    
    // Attempt deleting from themes
    const delRes = await client.query('DELETE FROM themes WHERE id = ANY($1::uuid[]);', [ids]);
    console.log('Delete result without cascade/cleanup:', delRes.rowCount);

    await client.query('ROLLBACK;');
    console.log('Transaction rolled back safely.');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('ERROR ON DELETION:', err.message, err.detail, err.table, err.constraint);
  }

  await client.end();
}

run().catch(console.error);
