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

  const cols = await client.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND (column_name LIKE '%theme%' OR column_name LIKE '%entity%')
    ORDER BY table_name;
  `);

  console.log('Columns referencing theme:');
  console.table(cols.rows);

  await client.end();
}

run().catch(console.error);
