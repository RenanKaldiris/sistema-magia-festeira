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
  const res = await client.query(`
    SELECT tablename, policyname, permissive, roles, cmd
    FROM pg_policies
    WHERE schemaname = 'public';
  `);
  console.log('Public table policies:', res.rows);

  const rls = await client.query(`
    SELECT relname, relrowsecurity
    FROM pg_class
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_namespace.nspname = 'public' AND relkind = 'r';
  `);
  console.log('RLS enabled per table:', rls.rows);

  await client.end();
}

run();
