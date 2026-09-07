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
  const res = await client.query("SELECT id, entity_id, original_name, storage_path FROM media WHERE entity_type = 'item'");
  console.log('Items with media in DB:', res.rows);
  const items = await client.query("SELECT id, code, name FROM items");
  console.log('All items in DB:', items.rows);
  await client.end();
}

run();
