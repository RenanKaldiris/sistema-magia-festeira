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

  const rentals = await client.query(`
    SELECT r.id, r.theme_id, t.name as theme_name, r.status, r.event_date
    FROM rentals r
    LEFT JOIN themes t ON t.id = r.theme_id;
  `);

  console.log('All rentals in DB:');
  console.table(rentals.rows);

  await client.end();
}

run().catch(console.error);
