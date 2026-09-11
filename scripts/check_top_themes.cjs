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

  const themes = await client.query('SELECT id, name, code, created_at FROM themes ORDER BY created_at ASC LIMIT 10;');
  console.log('Themes in DB:');
  console.table(themes.rows);

  await client.end();
}

run().catch(console.error);
